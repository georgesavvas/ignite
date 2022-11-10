// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, createContext, useEffect} from "react";

import {useSnackbar} from "notistack";

import clientRequest from "../services/clientRequest";
import serverRequest from "../services/serverRequest";


export const ConfigContext = createContext();

const serverDetailsDefault = {
  address: "localhost",
  password: ""
};

const accessDefault = {
  remote: false,
  projectsDir: "",
  serverProjectsDir: ""
};

const placeholder_config = {
  path: "",
  exts: "",
  name: ""
};

export const ConfigProvider = props => {
  const {enqueueSnackbar} = useSnackbar();
  const [config, setConfig] = useState(
    {serverDetails: {}, access: {}, dccConfig: [], ready: false}
  );

  useEffect(() => {
    if (config.lostConnection) return;
    const clientData = clientRequest("get_config");
    const clientAddress = window.services.get_env("IGNITE_CLIENT_ADDRESS");
    const serverPort = window.services.get_port();
    Promise.all([clientData, clientAddress, serverPort]).then(resp => {
      if (!resp[0]) return;
      const clientDataResults = resp[0].data;
      console.log("Config received:", clientDataResults);
      const savedServerDetails = clientDataResults.server_details;
      let savedServerAddress = savedServerDetails.address;
      const port = resp[2];
      serverDetailsDefault.address += `:${port}`;
      if (["localhost", "0.0.0.0"].includes(savedServerAddress)) {
        console.log(`Local server port not defined, fetched ${port}`);
        savedServerAddress += `:${port}`;
      }
      const finalServerDetails= {
        ...serverDetailsDefault,
        ...savedServerDetails,
        address: savedServerAddress
      };
      console.log("finalServerDetails", finalServerDetails);
      const savedAccess = {
        projectsDir: clientDataResults.access.projects_root,
        serverProjectsDir: clientDataResults.access.server_projects_root,
        remote: clientDataResults.access.remote
      };
      const savedDccConfig = clientDataResults.dcc_config;
      window.services.set_envs({
        IGNITE_SERVER_ADDRESS: finalServerDetails.address,
        IGNITE_SERVER_PASSWORD: finalServerDetails.password
      });
      setConfig({
        serverDetails: finalServerDetails,
        access: {
          ...accessDefault,
          ...savedAccess
        },
        dccConfig: savedDccConfig,
        clientAddress: resp[1],
        write: false,
        ready: true
      });
    });
  }, [config.lostConnection]);

  useEffect(() => {
    const interval = setInterval(() => {
      serverRequest("ping").then(resp => {
        if (!resp || !resp.ok) {
          if (config.lostConnection) return;
          console.log("Lost connection to server...");
          enqueueSnackbar("Lost connection to server...", {variant: "error"});
          setConfig(prevState => {
            const prev = {...prevState};
            prev["lostConnection"] = true;
            prev["write"] = false;
            return prev;
          });
        }
        else {
          if (!config.lostConnection) return;
          console.log("Server connection restored...");
          enqueueSnackbar("Connection restored!", {variant: "success"});
          setConfig(prevState => {
            const prev = {...prevState};
            prev["lostConnection"] = false;
            prev["write"] = true;
            return prev;
          });
        }
      });
      clientRequest("ping").then(resp => {
        if (!resp || !resp.ok) {
          if (config.lostConnection) return;
          console.log("Lost connection to client...");
          window.services.check_backend();
        }
      });
    }, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.lostConnection]);

  useEffect(() => {
    if (!config.write) return;
    if (config.lostConnection) window.services.check_backend();
    else handleConfigChange(config);
  }, [config]);

  const handleConfigChange = async c => {
    let serverAddress = c.serverDetails.address;
    if (serverAddress === "localhost" || serverAddress === "0.0.0.0") {
      console.log("Local server port not defined, fetching from main process");
      const port = await window.services.get_port();
      serverAddress += `:${port}`;
      console.log(`Port is ${port}, new address is ${serverAddress}`);
    }
    window.services.set_envs({
      IGNITE_SERVER_ADDRESS: serverAddress,
      IGNITE_SERVER_PASSWORD: c.serverDetails.password
    });
    const isServerLocal = serverAddress.startsWith("localhost") ||
      serverAddress.startsWith("0.0.0.0");
    const accessFormatted = {
      projects_root: c.access.projectsDir,
      server_projects_root: isServerLocal ? c.access.projectsDir :
        c.access.serverProjectsDir,
      remote: c.access.remote
    };
    const data = {
      access: accessFormatted,
      dcc_config: c.dccConfig,
      server_details: c.serverDetails
    };
    console.log("Setting config:", data);
    clientRequest("set_config", {data: data});
  };

  const addToDCCConfig = (config, data) => {
    if (!data || !data.length) {
      return [placeholder_config, ...config];
    }
    let existing_paths = [];
    config.forEach(existing => {
      existing_paths.push(existing.path);
    });
    const filtered = data.filter(
      new_config => !existing_paths.includes(new_config.path)
    );
    return [...config, ...filtered];
  };

  const modifyDCCConfig = (config, data) => {
    let cc = [...config];
    cc[data.index][data.field] = data.value;
    cc[data.index]["valid"] = data.valid;
    return cc;
  };

  const removeFromDCCConfig = (config, data) => {
    let cc = [...config];
    cc.splice(data.index, 1);
    return cc;
  };

  const handleSetServerDetails = data => {
    setConfig(prevState => ({
      ...prevState,
      write: true,
      serverDetails: {...prevState.serverDetails, ...data}
    }));
  };

  const handleSetAccess = data => {
    setConfig(prevState => ({
      ...prevState,
      write: true,
      access: {...prevState.access, ...data}
    }));
  };

  const handleSetDccConfig = (data, operation="modify") => {
    switch (operation) {
    default: {
      setConfig(prevState => (
        {
          ...prevState,
          write: true,
          dccConfig: data
        }
      ));
      break;
    }
    case "add": {
      setConfig(prevState => (
        {
          ...prevState,
          write: true,
          dccConfig: addToDCCConfig(prevState.dccConfig, data)
        }
      ));
      break;
    }
    case "remove": {
      setConfig(prevState => (
        {
          ...prevState,
          write: true,
          dccConfig: removeFromDCCConfig(prevState.dccConfig, data)
        }
      ));
      break;
    }
    }
  };

  const handleSetConfig = (setting, data, operation) => {
    switch(setting) {
    case "serverDetails": {
      handleSetServerDetails(data); break;
    }
    case "access": {
      handleSetAccess(data); break;
    }
    case "dccConfig": {
      handleSetDccConfig(data, operation); break;
    }
    default: return;
    }
  };

  return (
    <ConfigContext.Provider value={[config, handleSetConfig]}>
      {props.children}
    </ConfigContext.Provider>
  );
};

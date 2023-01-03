// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, createContext, useEffect, useRef} from "react";

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
  const serverIsLocal = useRef(true);
  const {enqueueSnackbar} = useSnackbar();
  const [config, setConfig] = useState(
    {serverDetails: {}, access: {}, dccConfig: [], ready: false}
  );

  useEffect(() => {
    if (config.lostConnection) return;
    firstRun();
  }, [config.lostConnection]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!config.ready) {
        // Server was down since the app started and never fetched config
        firstRun();
      }
      const serverName = serverIsLocal.current ? "server/client" : "server";
      serverRequest("ping").then(resp => {
        if (!resp || !resp.ok) {
          if (config.lostConnection) return;
          console.log(`Lost connection to ${serverName}...`);
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
          console.log(`${serverName} connection restored...`);
          enqueueSnackbar("Connection restored!", {variant: "success"});
          setConfig(prevState => {
            const prev = {...prevState};
            prev["lostConnection"] = false;
            prev["write"] = true;
            return prev;
          });
        }
      });
      if (serverIsLocal.current) return;
      clientRequest("ping").then(resp => {
        if (!resp || !resp.ok) {
          if (config.lostConnection) return;
          console.log("Lost connection to client...");
          // window.services.check_backend();
        }
      });
    }, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.lostConnection, config.ready, serverIsLocal.current]);

  useEffect(() => {
    if (!config.write) return;
    if (config.lostConnection) window.services.check_backend();
    else handleConfigChange(config);
  }, [config]);

  const firstRun = () => {
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
      const serverIsLocal_ = savedServerAddress.startsWith("localhost") ||
      savedServerAddress.startsWith("0.0.0.0");
      serverIsLocal.current = serverIsLocal_;
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
  };

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
    const serverIsLocal_ = serverAddress.startsWith("localhost") ||
      serverAddress.startsWith("0.0.0.0");
    serverIsLocal.current = serverIsLocal_;
    const accessFormatted = {
      projects_root: c.access.projectsDir,
      server_projects_root: serverIsLocal_ ? c.access.projectsDir :
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

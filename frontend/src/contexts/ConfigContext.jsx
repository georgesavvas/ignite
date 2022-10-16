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
  address: "",
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
    {serverDetails: {}, access: {}, dccConfig: []}
  );

  useEffect(() => {
    const clientData = clientRequest("get_config");
    const clientAddress = window.services.get_env("IGNITE_CLIENT_ADDRESS");
    Promise.all([clientData, clientAddress]).then(resp => {
      const clientDataResults = resp[0].data;
      console.log("Config received:", clientDataResults);
      const savedServerDetails = clientDataResults.server_details;
      const savedAccess = {
        projectsDir: clientDataResults.access.projects_root,
        serverProjectsDir: clientDataResults.access.server_projects_root,
        remote: clientDataResults.access.remote
      };
      const savedDccConfig = clientDataResults.dcc_config;
      window.services.set_envs({
        IGNITE_SERVER_ADDRESS: savedServerDetails.address,
        IGNITE_SERVER_PASSWORD: savedServerDetails.password
      });
      setConfig({
        serverDetails: {...serverDetailsDefault, ...savedServerDetails},
        access: {
          ...accessDefault,
          ...savedAccess
        },
        dccConfig: savedDccConfig,
        clientAddress: resp[1],
        write: false
      });
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      serverRequest("ping").then(resp => {
        if (!resp.ok) {
          if (config.lostConnection) return;
          console.log("Lost connection to server...");
          enqueueSnackbar("Lost connection to server...", {variant: "error"});
          setConfig(prevState => {
            const prev = {...prevState};
            prev["lostConnection"] = true;
            prev["write"] = false;
            return prev;
          });
          window.services.check_server();
        }
        else {
          if (!config.lostConnection) return;
          console.log("Server connection restored...");
          enqueueSnackbar("Connection restored!", {variant: "success"});
          setConfig(prevState => {
            const prev = {...prevState};
            prev["lostConnection"] = false;
            prev["write"] = false;
            return prev;
          });
        }
      });
      clientRequest("ping").then(resp => {
        if (!resp.ok) {
          console.log("Lost connection to client...");
          window.services.check_client();
        }
      });
    }, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [config.lostConnection]);

  useEffect(() => {
    if (!config.write) return;
    window.services.set_envs({
      IGNITE_SERVER_ADDRESS: config.serverDetails.address,
      IGNITE_SERVER_PASSWORD: config.serverDetails.password
    });
    const isServerLocal = config.serverDetails.address.startsWith("localhost");
    const accessFormatted = {
      projects_root: config.access.projectsDir,
      server_projects_root: isServerLocal ? config.access.projectsDir :
        config.access.serverProjectsDir,
      remote: config.access.remote
    };
    const data = {
      access: accessFormatted,
      dcc_config: config.dccConfig,
      server_details: config.serverDetails
    };
    console.log("Setting config:", data);
    clientRequest("set_config", {data: data});
  }, [config]);

  const addToDCCConfig = (config, data) => {
    if (!data) {
      return [...config, ...placeholder_config];
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
          dccConfig: modifyDCCConfig(prevState.dccConfig, data)
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

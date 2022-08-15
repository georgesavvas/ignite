import { useState, createContext, useEffect, useRef } from "react";
import clientRequest from "../services/clientRequest";
import serverRequest from "../services/serverRequest";

export const ConfigContext = createContext();

const serverDetailsDefault = {
  address: "",
  password: ""
}

const accessDefault = {
  remote: false,
  projectsDir: "",
  serverProjectsDir: ""
}

const placeholder_config = {
  path: "",
  exts: "",
  name: ""
}

export const ConfigProvider = props => {
  const [config, setConfig] = useState({serverDetails: {}, access: {}, dccConfig: []});
  const [writeIncr, setWriteIncr] = useState(0);

  useEffect(() => {
    clientRequest("get_config").then(resp => {
      const data = resp.data;
      console.log("Config received:", data);
      const savedServerDetails = data.server_details;
      const savedAccess = {
        projectsDir: data.access.projects_root,
        serverProjectsDir: data.access.server_projects_root,
        remote: data.access.remote
      }
      const savedDccConfig = data.dcc_config;
      window.services.set_envs({
        IGNITE_SERVER_ADDRESS: savedServerDetails.address,
        IGNITE_SERVER_PASSWORD: savedServerDetails.password
      })
      setConfig({
        serverDetails: {...serverDetailsDefault, ...savedServerDetails},
        access: {...accessDefault, ...savedAccess},
        dccConfig: savedDccConfig
      })
    });
  }, [])

  useEffect(() => {
    if (writeIncr <= 0) {
      setWriteIncr(1);
      return;
    }
    window.services.set_envs({
      IGNITE_SERVER_ADDRESS: config.serverDetails.address,
      IGNITE_SERVER_PASSWORD: config.serverDetails.password
    })
    const accessFormatted = {
      projects_root: config.access.projectsDir,
      remote: config.access.remote
    }
    const data = {
      access: accessFormatted,
      dcc_config: config.dccConfig,
      server_details: config.serverDetails
    }
    console.log("Setting config:", data);
    clientRequest("set_config", {data: data})
  }, [config])

  const addToDCCConfig = (config, data) => {
    if (!data) {
      return [...config, ...placeholder_config]
    }
    let existing_paths = [];
    config.forEach(existing => {
      existing_paths.push(existing.path);
    });
    const filtered = data.filter(
      new_config => !existing_paths.includes(new_config.path)
    );
    return [...config, ...filtered];
  }

  const modifyDCCConfig = (config, data) => {
    let cc = [...config];
    cc[data.index][data.field] = data.value;
    cc[data.index]["valid"] = data.valid;
    return cc;
  }

  const removeFromDCCConfig = (config, data) => {
    let cc = [...config];
    cc.splice(data.index, 1);
    return cc;
  }

  const handleSetServerDetails = data => {
    setConfig(prevState => ({...prevState, serverDetails: {...prevState.serverDetails, ...data}}));
  }

  const handleSetAccess = data => {
    setConfig(prevState => ({...prevState, access: {...prevState.access, ...data}}));
  }

  const handleSetDccConfig = (data, operation) => {
    switch (operation) {
      case "add": {
        setConfig(prevState => (
          {...prevState, dccConfig: addToDCCConfig(prevState.dccConfig, data)}
        ));
        break;
      }
      case "modify": {
        setConfig(prevState => (
          {...prevState, dccConfig: modifyDCCConfig(prevState.dccConfig, data)}
        ));
        break;
      }
      case "remove": {
        setConfig(prevState => (
          {...prevState, dccConfig: removeFromDCCConfig(prevState.dccConfig, data)}
        ));
        break;
      }
    }
  }

  const handleSetConfig = (setting, data, operation="") => {
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
    }
  }

  return (
    <ConfigContext.Provider value={[config, handleSetConfig]}>
      {props.children}
    </ConfigContext.Provider>
  )
}

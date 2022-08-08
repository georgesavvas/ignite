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

const dccConfigDefault = [
  {
    name: "Houdini 19",
    path: "C:\\Program Files\\Side Effects Software\\Houdini 19.0.506\\bin\\hmaster.exe",
    valid: true,
    exts: ["hip, hipnc"]
  },
  {
    name: "Maya",
    path: "C:\\Program Files\\Autodesk\\Maya2023\\bin\\maya.exe",
    valid: true,
    exts: ["ma"]
  },
  {
    name: "Blender",
    path: "blender.exe",
    valid: true,
    exts: []
  },
  {
    name: "Nuke",
    path: "nuke.exe",
    valid: true,
    exts: []
  }
]

export const ConfigProvider = props => {
  const [serverDetails, setServerDetails] = useState({})
  const [access, setAccess] = useState({})
  const [dccConfig, setDccConfig] = useState([]);
  const [config, setConfig] = useState({serverDetails: {}, access: {}, dccConfig: []});
  const [writeIncr, setWriteIncr] = useState(0);

  useEffect(() => {
    clientRequest("get_server_details").then(resp => {
      const savedServerDetails = resp.data;
      setServerDetails({...serverDetailsDefault, ...savedServerDetails});
    });

    clientRequest("get_access").then(resp => {
      const savedAccess = resp.data;
      serverRequest("get_projects_root").then(resp => {
        const serverProjectsDir = resp.data;
        setAccess({...accessDefault, ...savedAccess, serverProjectsDir: serverProjectsDir});
      });
    });

    clientRequest("get_dcc_config").then((resp) => {
      setDccConfig(resp.data);
    });
  }, [])

  useEffect(() => {
    if (writeIncr <= 0) {
      return;
    }
    window.services.set_envs({
      IGNITE_SERVER_ADDRESS: serverDetails.address,
      IGNITE_SERVER_PASSWORD: serverDetails.password
    })
    clientRequest("set_server_details", {data: serverDetails})
    clientRequest("set_access", {data: access})
    clientRequest("set_dcc_config", {data: dccConfig})
  }, [writeIncr])

  useEffect(() => {
    setConfig({
      serverDetails: serverDetails,
      access: access,
      dccConfig: dccConfig
    })
    setWriteIncr(prevState => prevState + 1);
  }, [serverDetails, access, dccConfig])
  
  const addToDCCConfig = prevState => {
    const placeholder = {
      name: "",
      path: "",
      exts: ""
    };
    return [...prevState, placeholder];
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
    setServerDetails(prevState => ({...prevState, ...data}));
  }

  const handleSetAccess = data => {
    setAccess(prevState => ({...prevState, ...data}));
  }

  const handleSetDccConfig = (data, operation) => {
    switch (operation) {
      case "add": {
        setDccConfig(prevState => addToDCCConfig(prevState)); break;
      }
      case "modify": {
        setDccConfig(prevState => modifyDCCConfig(prevState, data)); break;
      }
      case "remove": {
        setDccConfig(prevState => removeFromDCCConfig(prevState, data)); break;
      }
      case "revertToDefaults": {
        setDccConfig(dccConfigDefault); break;
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

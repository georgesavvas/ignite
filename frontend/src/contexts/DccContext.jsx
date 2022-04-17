import { useState, createContext, useEffect, useRef } from "react";

export const DccContext = createContext();

const defaultConfig = [
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

export const DccProvider = props => {
  const [dccConfig, setDccConfig] = useState([]);
  const [writeIncr, setWriteIncr] = useState(0);
  const noWrite = useRef(true);

  useEffect(() => {
    fetch("http://127.0.0.1:9091/api/v1/get_dcc_config").then((resp) => {
      return resp.json();
    }).then((resp) => {
      console.log(resp);
      noWrite.current = true;
      setDccConfig(resp.data);
    });
  }, [])

  useEffect(() => {
    // localStorage.setItem("dcc_config", JSON.stringify(dccConfig));
    if (!writeIncr) {
      return;
    }

    const data = {
      config: dccConfig
    };
    fetch(
      "http://127.0.0.1:9091/api/v1/set_dcc_config", {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )
  }, [writeIncr])
  
  const addToConfig = prevState => {
    const placeholder = {
      name: "",
      path: "",
      exts: ""
    };
    return [...prevState, placeholder];
  }

  const modifyConfig = (config, data) => {
    let cc = [...config];
    cc[data.index][data.field] = data.value;
    cc[data.index]["valid"] = data.valid;
    return cc;
  }

  const removeFromConfig = (config, data) => {
    let cc = [...config];
    cc.splice(data.index, 1);
    return cc;
  }

  const handleSetDccConfig = (data, operation) => {
    switch (operation) {
      case "add": {setDccConfig(prevState => addToConfig(prevState)); break;}
      case "modify": {setDccConfig(prevState => modifyConfig(prevState, data)); break;}
      case "remove": {setDccConfig(prevState => removeFromConfig(prevState, data)); break;}
      case "revertToDefaults": {setDccConfig(defaultConfig); break;}
    }
    setWriteIncr(prevState => prevState + 1);
  }

  return (
    <DccContext.Provider value={[dccConfig, handleSetDccConfig]}>
      {props.children}
    </DccContext.Provider>
  )
}

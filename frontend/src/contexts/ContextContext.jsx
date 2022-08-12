import { useState, createContext, useContext, useEffect } from "react";
import BuildFileURL from "../services/BuildFileURL";
import serverRequest from "../services/serverRequest";
import { ConfigContext } from "../contexts/ConfigContext";

export const ContextContext = createContext();

export const ContextProvider = props => {
  const [config, setConfig] = useContext(ConfigContext);
  const [currentContext, setCurrentContext, refreshContext] = useState({update: 0});

  useEffect(() => {
    const data = localStorage.getItem("context");
    const context = JSON.parse(data);
    if (!context || !context.path) return;
    setCurrentContext(context);
  }, [])

  async function handleContextChange(path) {
    const path_processed = BuildFileURL(path, config, {reverse: true, pathOnly: true});
    let success = false;
    const resp = await serverRequest("get_context_info", {path: path_processed})
    let data = resp.data;
    if (!data) return false;
    if (!Object.keys(data).length) return false;
    for (const key of ["parent", "path", "posix", "project_path"]) {
      data[key] = BuildFileURL(data[key], config, {pathOnly: true});
    }
    data.posix = data.posix.replaceAll("\\", "/");
    data.update = 0;
    data.root = config.access.projectsDir;
    setCurrentContext(data);
    localStorage.setItem("context", JSON.stringify(data));
    success = true;
    return success;
  };

  function refresh() {
    setCurrentContext(prevState => ({...prevState, update: prevState.update + 1}));
  }

  return (
    <ContextContext.Provider value={[currentContext, handleContextChange, refresh]}>
      {props.children}
    </ContextContext.Provider>
  )
};

export const setProject = (project, setCurrentContext) => {
  setCurrentContext(project);
}

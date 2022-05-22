import { useState, createContext, useEffect } from "react";
import serverRequest from "../services/serverRequest";

export const ContextContext = createContext();

export const ContextProvider = props => {
  const [currentContext, setCurrentContext, refreshContext] = useState({update: 0});

  useEffect(() => {
    const data = localStorage.getItem("context");
    const context = JSON.parse(data);
    if (!context || !context.path) return;
    setCurrentContext(context);
  }, [])

  async function handleContextChange(path) {
    let success = false;
    const resp = await serverRequest("get_context_info", {path: path})
    const data = resp.data;
    if (!Object.keys(data).length) return false;
    data.update = 0;
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

export function setProject(project, setCurrentContext) {
  serverRequest("get_projects_root").then(resp => {
    const data = resp.data;
    setCurrentContext(data + "/" + project);
  })
}

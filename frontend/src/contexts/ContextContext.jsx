import { useState, createContext } from "react";
import serverRequest from "../services/serverRequest";

export const ContextContext = createContext();

export const ContextProvider = props => {
  const [currentContext, setCurrentContext] = useState({update: 0});

  async function handleContextChange(path) {
    let success = false;
    const resp = await serverRequest("get_context_info", {path: path})
    const data = resp.data;
    if (!Object.keys(data).length) return false;
    setCurrentContext(data);
    success = true;
    return success;
  };

  return (
    <ContextContext.Provider value={[currentContext, handleContextChange]}>
      {props.children}
    </ContextContext.Provider>
  )
};

import { useState, createContext } from "react";

export const ContextContext = createContext();

export const ContextProvider = props => {
  const [currentContext, setCurrentContext] = useState({});
  return (
    <ContextContext.Provider value={[currentContext, setCurrentContext]}>
      {props.children}
    </ContextContext.Provider>
  );
}

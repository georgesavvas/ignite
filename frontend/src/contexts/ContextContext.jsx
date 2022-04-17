import { useState, createContext } from "react";

export const ContextContext = createContext();

export const ContextProvider = props => {
  const [currentContext, setCurrentContext] = useState({update: 0});
  return (
    <ContextContext.Provider value={[currentContext, setCurrentContext]}>
      {props.children}
    </ContextContext.Provider>
  );
}

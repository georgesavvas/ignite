import React, {useState, createContext} from "react";

export const EntityContext = createContext();

export const EntityProvider = props => {
  const [selectedEntity, setSelectedEntity] = useState({});
  return (
    <EntityContext.Provider value={[selectedEntity, setSelectedEntity]}>
      {props.children}
    </EntityContext.Provider>
  );
};

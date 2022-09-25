import React, {useState, createContext} from "react";

export const VaultContext = createContext();

export const VaultProvider = props => {
  const [vaultContext, setVaultContext] = useState({update: 0});

  const refreshVault = () => {
    setVaultContext(prevState => ({...prevState, update: prevState.update + 1}));
  };

  return (
    <VaultContext.Provider value={[vaultContext, setVaultContext, refreshVault]}>
      {props.children}
    </VaultContext.Provider>
  );
};

import { useState, createContext } from "react";

export const AssetContext = createContext();

export const AssetProvider = props => {
  const [selectedAsset, setSelectedAsset] = useState("");
  return (
    <AssetContext.Provider value={[selectedAsset, setSelectedAsset]}>
      {props.children}
    </AssetContext.Provider>
  );
}

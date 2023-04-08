// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, createContext, useEffect, useContext} from "react";
import BuildFileURL from "../services/BuildFileURL";
import { ConfigContext } from "./ConfigContext";

export const VaultContext = createContext();

export const VaultProvider = props => {
  const [vaultContext, setVaultContext] = useState({update: 0});
  const [config] = useContext(ConfigContext);

  useEffect(() => {
    const path = BuildFileURL(
      "__vault__",
      config,
      {reverse: true, pathOnly: true}
    );
    setVaultContext(prev => ({...prev, path: path}));
  }, [config.access, config.serverDetails]);

  const refreshVault = () => {
    setVaultContext(prevState => ({...prevState, update: prevState.update + 1}));
  };

  return (
    <VaultContext.Provider value={[vaultContext, setVaultContext, refreshVault]}>
      {props.children}
    </VaultContext.Provider>
  );
};

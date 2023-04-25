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

import { ConfigContext, ConfigContextType } from "./ConfigContext";
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import { Entity } from "@renderer/types/common";
import clientRequest from "../services/clientRequest";

type Crate = {
  id: string;
  entities: Entity[];
};

type CrateContextType = {
  addCrate: () => void;
  removeCrate: () => void;
  addToCrate: () => void;
  removeFromCrate: () => void;
  dropFloating: boolean;
  emptyCrate: () => void;
  floating: boolean;
  crates: Crate[];
  forceOpen: boolean;
  setForceOpen: (forceOpen: boolean) => void;
};

export const CrateContext = createContext<CrateContextType | undefined>(undefined);

export const CrateProvider = ({ children }: PropsWithChildren) => {
  const [fetched, setFetched] = useState(false);
  const [crates, setCrates] = useState<Entity[]>([]);
  const [floating, setFloating] = useState([]);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [forceOpen, setForceOpen] = useState(false);

  useEffect(() => {
    if (!config.ready) return;
    if (!fetched) {
      clientRequest("get_crates").then((resp) => {
        setCrates(resp.data || []);
        setFetched(true);
      });
      return;
    }
    const data = crates.map((crate) => {
      const entities = crate.entities.map((entity) => entity.uri);
      return { id: crate.id, entities: entities };
    });
    clientRequest("set_crates", { data: data }).then((resp) => {
      if (!resp.ok) console.log("There was an issue setting crates");
    });
  }, [crates, config.ready]);

  const addCrate = async (entities = []) => {
    const crateID = await window.services.uuid();
    setCrates((prev) => {
      let existing = [...prev];
      existing = existing.concat({ id: crateID, entities: entities });
      return existing;
    });
  };

  const removeCrate = async (crateID) => {
    setCrates((prev) => {
      const existing = [...prev];
      const index = existing.findIndex((crate) => crate.id === crateID);
      existing.splice(index, 1);
      return existing;
    });
  };

  const addToCrate = async (entities) => {
    if (crates.length) setFloating((prev) => [...prev, ...entities]);
    else addCrate(entities);
  };

  const handleAddToCrate = async (crateID, entities) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      crate.entities.push(...entities);
      return existing;
    });
  };

  const removeFromCrate = async (crateID, index) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      crate.entities.splice(index, 1);
      return existing;
    });
  };

  const emptyCrate = async (crateID) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      crate.entities = [];
      return existing;
    });
  };

  const dropFloating = async (crateID) => {
    setFloating((prev) => {
      crateID ? handleAddToCrate(crateID, prev) : addCrate(prev);
      return [];
    });
  };

  return (
    <CrateContext.Provider
      value={{
        addCrate: addCrate,
        removeCrate: removeCrate,
        addToCrate: addToCrate,
        removeFromCrate: removeFromCrate,
        dropFloating: dropFloating,
        emptyCrate: emptyCrate,
        floating: floating,
        crates: crates,
        forceOpen: forceOpen,
        setForceOpen: setForceOpen,
      }}
    >
      {children}
    </CrateContext.Provider>
  );
};

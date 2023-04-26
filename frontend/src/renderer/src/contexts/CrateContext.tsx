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

import { Entity } from "@renderer/types/common";
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import clientRequest from "../services/clientRequest";
import { ConfigContext, ConfigContextType } from "./ConfigContext";

type Crate = {
  id: string;
  entities: Entity[];
};

export type CrateContextType = {
  addCrate: (entities?: Entity[]) => void;
  removeCrate: (crateId: string) => void;
  addToCrate: (entities: Entity[]) => void;
  removeFromCrate: (crateID: string, index: number) => void;
  dropFloating: (crateID: string) => void;
  emptyCrate: (crateID: string) => void;
  floating: Entity[];
  crates: Crate[];
  forceOpen: boolean;
  setForceOpen: (forceOpen: boolean) => void;
};

export const CrateContext = createContext<CrateContextType | undefined>(undefined);

export const CrateProvider = ({ children }: PropsWithChildren) => {
  const [fetched, setFetched] = useState(false);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [floating, setFloating] = useState<Entity[]>([]);
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

  const addCrate = async (entities: Entity[] = []) => {
    const crateID = await window.services.uuid();
    setCrates((prev) => {
      let existing = [...prev];
      existing = existing.concat({ id: crateID, entities: entities });
      return existing;
    });
  };

  const removeCrate = async (crateID: string) => {
    setCrates((prev) => {
      const existing = [...prev];
      const index = existing.findIndex((crate) => crate.id === crateID);
      existing.splice(index, 1);
      return existing;
    });
  };

  const addToCrate = async (entities: Entity[]) => {
    if (crates.length) setFloating((prev) => [...prev, ...entities]);
    else addCrate(entities);
  };

  const handleAddToCrate = async (crateID: string, entities: Entity[]) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      if (!crate) return existing;
      crate.entities.push(...entities);
      return existing;
    });
  };

  const removeFromCrate = async (crateID: string, index: number) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      if (!crate) return existing;
      crate.entities.splice(index, 1);
      return existing;
    });
  };

  const emptyCrate = async (crateID: string) => {
    setCrates((prev) => {
      const existing = [...prev];
      const crate = existing.find((crate) => crate.id === crateID);
      if (!crate) return existing;
      crate.entities = [];
      return existing;
    });
  };

  const dropFloating = async (crateID: string) => {
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

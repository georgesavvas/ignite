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

import { AssetVersion } from "@renderer/types/common";
import { debounce } from "lodash";
import { useContext, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HandlerProps, ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import Modal from "../../components/Modal";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { VaultContext, VaultContextType } from "../../contexts/VaultContext";
import serverRequest from "../../services/serverRequest";
import loadReflexLayout from "../../utils/loadReflexLayout";
import saveReflexLayout from "../../utils/saveReflexLayout";
import Browser from "./Browser";
import CollectionTree from "./CollectionTree";
import Details from "./Details";
import styles from "./Vault.module.css";

const debounced = debounce((fn) => fn(), 500);

const splitterStyle = {
  borderColor: "rgb(40,40,40)",
  backgroundColor: "rgb(40,40,40)",
};

const defaultFlexRations = {
  "vault.collections": 0.15,
  "vault.browser": 0.6,
  "vault.details": 0.25,
};

export type QueryType = {
  filter_string: string;
  filters?: {};
};

export type CollectionType = {
  path: string;
};

export type PagesType = {
  total: number;
  current: number;
  results: number;
};

interface VaultProps {
  open: boolean;
  onClose: () => void;
}

const Vault = (props: VaultProps) => {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [collectionData, setCollectionData] = useState([]);
  const [refreshValue, setRefreshValue] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [query, setQuery] = useState<QueryType>({ filter_string: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState<PagesType>({ total: 1, current: 1, results: 0 });
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedEntity, setSelectedEntity] = useState<AssetVersion>();
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const { vaultContext } = useContext(VaultContext) as VaultContextType;

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const collections = data["vault.collections"];
    const browser = data["vault.browser"];
    const details = data["vault.details"];
    if (!collections || !browser || !details) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const fullWidth = collections[0] + browser[0] + details[0];
    const ratios = {
      "vault.collections": collections[0] / fullWidth,
      "vault.browser": browser[0] / fullWidth,
      "vault.details": details[0] / fullWidth,
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    const previous = localStorage.getItem("selectedCollection");
    setSelectedCollection(selectedCollection || (previous ?? "/all"));
  }, []);

  useEffect(() => {
    if (!props.open) return;
    setSelectedEntity(undefined);
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    if (!Object.entries(config.access).length) return;
    serverRequest("get_collections", { data: { user: undefined } }).then((resp) => {
      const data = resp.data;
      setCollectionData(data && data.studio ? data.studio : []);
    });
  }, [vaultContext, refreshValue, props.open]);

  useEffect(() => {
    if (!props.open) return;
    if (!config.ready) return;
    const data = {
      path: vaultContext.path,
      page: pages.current,
      limit: tilesPerPage,
      query: { ...query, latest: true },
    };
    setIsLoading(true);
    serverRequest("get_assetversions", data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
      setPages((prev) => ({
        ...prev,
        total: resp.pages?.total,
        results: resp.pages?.results,
      }));
    });
  }, [
    pages.current,
    vaultContext,
    query,
    tilesPerPage,
    selectedCollection,
    refreshValue,
    props.open,
    config.ready,
  ]);

  const handleEntitySelected = (entity: IgniteAssetVersion) => {
    setSelectedEntity(entity);
  };

  const handleRefresh = () => {
    setRefreshValue((prev) => prev + 1);
  };

  const handleResized = (data: HandlerProps) => {
    saveReflexLayout(data);
  };

  const handleQueryChange = (newQuery: QueryType) => {
    setIsLoading(true);
    debounced(() => {
      setQuery((prev) => ({ ...prev, ...newQuery }));
      setPages((prev) => ({ ...prev, current: 1 }));
    });
  };

  const handleFilterChange = (data: any) => {
    setIsLoading(true);
    debounced(() => {
      setQuery((prev) => ({ ...prev, filters: { ...prev.filters, ...data } }));
      setPages((prev) => ({ ...prev, current: 1 }));
    });
  };

  const handleCollectionChange = (coll: CollectionType) => {
    setSelectedCollection(coll.path);
    localStorage.setItem("selectedCollection", coll.path);
  };

  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" fullWidth fullHeight>
      <ReflexContainer orientation="vertical" className={styles.container}>
        <ReflexElement
          flex={flexRatios["vault.collections"]}
          name="vault.collections"
          onStopResize={handleResized}
        >
          <div className={styles.collectionContainer}>
            <DndProvider backend={HTML5Backend}>
              <CollectionTree
                collectionData={collectionData}
                refreshValue={refreshValue}
                onFilterChange={handleFilterChange}
                selectedCollection={selectedCollection}
                setSelectedCollection={handleCollectionChange}
                onRefresh={handleRefresh}
              />
            </DndProvider>
          </div>
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.browser"]}
          name="vault.browser"
          onStopResize={handleResized}
        >
          <Browser
            onRefresh={handleRefresh}
            selectedCollection={selectedCollection}
            loadedData={loadedData}
            pages={pages}
            handleQueryChange={handleQueryChange}
            query={query}
            isLoading={isLoading}
            setTilesPerPage={setTilesPerPage}
            handleEntitySelected={handleEntitySelected}
            setPages={setPages}
            selectedEntity={selectedEntity}
            onFilterChange={handleFilterChange}
          />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.details"]}
          name="vault.details"
          onStopResize={handleResized}
        >
          <Details
            entity={selectedEntity}
            setSelectedEntity={setSelectedEntity}
            onRefresh={handleRefresh}
          />
        </ReflexElement>
      </ReflexContainer>
    </Modal>
  );
};

export default Vault;

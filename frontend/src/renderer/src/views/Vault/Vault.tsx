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

import debounce from "lodash.debounce";
import React, { useContext, useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";

import Modal from "../../components/Modal";
import { ConfigContext } from "../../contexts/ConfigContext";
import { VaultContext } from "../../contexts/VaultContext";
import BuildFileURL from "../../services/BuildFileURL";
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

function Vault(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [collectionData, setCollectionData] = useState([]);
  const [refreshValue, setRefreshValue] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState();
  const [query, setQuery] = useState({ filter_string: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({ total: 1, current: 1 });
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedEntity, setSelectedEntity] = useState({});
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [vaultContext] = useContext(VaultContext);

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
    setSelectedEntity("");
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
      setPages((prevState) => ({
        ...prevState,
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

  const handleEntitySelected = (entity) => {
    setSelectedEntity(entity);
  };

  const handleRefresh = () => {
    setRefreshValue((prevState) => prevState + 1);
  };

  const handleResized = (data) => {
    saveReflexLayout(data);
  };

  const handleQueryChange = (newQuery) => {
    setIsLoading(true);
    debounced(() => {
      setQuery((prevState) => ({ ...prevState, ...newQuery }));
      setPages((prevState) => ({ ...prevState, current: 1 }));
    });
  };

  const handleFilterChange = (data) => {
    setIsLoading(true);
    debounced(() => {
      setQuery((prevState) => ({ ...prevState, filters: { ...prevState.filters, ...data } }));
      setPages((prevState) => ({ ...prevState, current: 1 }));
    });
  };

  const handleCollectionChange = (coll) => {
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
            refreshValue={refreshValue}
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
}

export default Vault;

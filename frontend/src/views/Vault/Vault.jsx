import React, { useState, useEffect } from "react";
import styles from "./Vault.module.css";
import Modal from "../../components/Modal";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex';
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import Browser from "./Browser";
import Details from "./Details";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CollectionTree from "./CollectionTree";
import serverRequest from "../../services/serverRequest";

const splitterStyle = {
  borderColor: "rgb(40,40,40)",
  backgroundColor: "rgb(40,40,40)"
}

const defaultFlexRations = {
  "vault.collections": 0.15,
  "vault.browser": 0.6,
  "vault.details": 0.25
}

function Vault(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [collectionData, setCollectionData] = useState([]);
  const [refreshValue, setRefreshValue] = useState(0);
  const [selectedCollection, setSelectedCollection] = useState("");
  const [query, setQuery] = useState({filter_string: ""});
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedAsset, setSelectedAsset] = useState({});

  useEffect(() => {
    const data = loadReflexLayout()
    if (!data) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const collections = data["vault.collections"]
    const browser = data["vault.browser"]
    const details = data["vault.details"]
    if (!collections || !browser || !details) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const fullWidth = collections[0] + browser[0] + details[0]
    const ratios = {
      "vault.collections": collections[0] / fullWidth,
      "vault.browser": browser[0] / fullWidth,
      "vault.details": details[0] / fullWidth
    }
    setFlexRatios(ratios)
  }, [])

  useEffect(() => {
    const selectedCollection = localStorage.getItem("selectedCollection")
    handleCollectionChange(selectedCollection || "studio:/all")
  }, [])

  useEffect(() => {
    serverRequest("get_collections").then(resp => {
      const data = resp.data
      setCollectionData(data && data.studio ? data.studio : [])
    })
  }, [refreshValue])

  useEffect(() => {
    const data = {
      page: pages.current,
      limit: tilesPerPage,
      query: query
    }
    setIsLoading(true)
    serverRequest("vault/get_assets", data).then(resp => {
      setIsLoading(false)
      setLoadedAssets(resp.data)
      setPages(prevState => ({...prevState, total: resp.pages.total, results: resp.pages.results}))
    })
  }, [pages, refreshValue, query, tilesPerPage, selectedCollection])

  const handleAssetSelected = (asset) => {
    setSelectedAsset(asset)
    props.setCurrentAsset(asset)
  }

  const handleRefresh = () => {
    props.setRefreshValue(prevState => (prevState + 1))
  }

  const handleResized = data => {
    saveReflexLayout(data)
  }

  const handleQueryChange = newQuery => {
    setQuery(prevState => ({...prevState, ...newQuery}))
    setPages(prevState => ({...prevState, current: 1}))
  }

  const handleCollectionChange = coll => {
    setSelectedCollection(coll)
    handleQueryChange({collection: coll})
    localStorage.setItem("selectedCollection", coll)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" fullWidth
      fullHeight
    >
      <ReflexContainer orientation="vertical">
        <ReflexElement
          flex={flexRatios["vault.collections"]}
          name="vault.collections"
          onStopResize={handleResized}
        >
          <div className={styles.collectionContainer}>
            <DndProvider backend={HTML5Backend}>
              <CollectionTree collectionData={collectionData}
                refreshValue={refreshValue} setRefreshValue={setRefreshValue}
                selectedCollection={selectedCollection} onRefresh={handleRefresh}
                setSelectedCollection={handleCollectionChange}
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
            refreshValue={refreshValue} setRefreshValue={setRefreshValue}
            selectedCollection={selectedCollection} loadedAssets={loadedAssets}
            pages={pages} handleQueryChange={handleQueryChange} query={query}
            isLoading={isLoading} setTilesPerPage={setTilesPerPage}
            handleAssetSelected={handleAssetSelected} setPages={setPages}
            setIsLoading={setIsLoading}
          />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.details"]}
          name="vault.details"
          onStopResize={handleResized}
        >
          <Details />
        </ReflexElement>
      </ReflexContainer>
    </Modal>
  )
}

export default Vault;

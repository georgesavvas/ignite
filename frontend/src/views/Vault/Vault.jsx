import React, { useState, useEffect, useContext } from "react";
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
import debounce from "lodash.debounce";
import serverRequest from "../../services/serverRequest";
import {ConfigContext} from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import {VaultContext} from "../../contexts/VaultContext";

const debounced = debounce(fn => fn(), 500)

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
  const [selectedCollection, setSelectedCollection] = useState();
  const [query, setQuery] = useState({filter_string: ""});
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedEntity, setSelectedEntity] = useState({});
  const [config, setConfig] = useContext(ConfigContext);
  const [vaultContext, setVaultContext, refreshVault] = useContext(VaultContext);

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
    handleCollectionChange(selectedCollection || undefined)
  }, [])

  useEffect(() => {
    serverRequest("get_collections", {data: {user: undefined}}).then(resp => {
      const data = resp.data
      setCollectionData(data && data.studio ? data.studio : [])
    })
  }, [vaultContext])

  useEffect(() => {
    const data = {
      path: BuildFileURL(`__vault__`, config, {reverse: true, pathOnly: true}),
      page: pages.current,
      limit: tilesPerPage,
      query: query
    }
    setIsLoading(true)
    serverRequest("get_assets", data).then(resp => {
      setIsLoading(false)
      setLoadedData(resp.data)
      setPages(prevState => ({...prevState, total: resp.pages.total, results: resp.pages.results}))
    })
  }, [pages.current, vaultContext, query, tilesPerPage, selectedCollection])

  const handleEntitySelected = entity => {
    setSelectedEntity(entity)
  }

  const handleRefresh = () => {
    setRefreshValue(prevState => (prevState + 1))
  }

  const handleResized = data => {
    saveReflexLayout(data)
  }

  const handleQueryChange = newQuery => {
    setIsLoading(true)
    debounced(() => {
      setQuery(prevState => ({...prevState, ...newQuery}))
      setPages(prevState => ({...prevState, current: 1}))
    })
  }

  const handleFilterChange = data => {
    setIsLoading(true)
    debounced(() => {
      setQuery(prevState => ({...prevState, filters: {...prevState.filters, ...data}}))
      setPages(prevState => ({...prevState, current: 1}))
    })
  }

  const handleCollectionChange = coll => {
    setSelectedCollection(coll)
    // handleQueryChange({collection: coll})
    localStorage.setItem("selectedCollection", coll)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" fullWidth
      fullHeight
    >
      <ReflexContainer orientation="vertical" className={styles.container}>
        <ReflexElement
          flex={flexRatios["vault.collections"]}
          name="vault.collections"
          onStopResize={handleResized}
        >
          <div className={styles.collectionContainer}>
            <DndProvider backend={HTML5Backend}>
              <CollectionTree collectionData={collectionData}
                refreshValue={refreshValue}
                selectedCollection={selectedCollection} onRefresh={handleRefresh}
                setSelectedCollection={handleCollectionChange} onFilterChange={handleFilterChange}
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
            refreshValue={refreshValue} onRefresh={handleRefresh}
            selectedCollection={selectedCollection} loadedData={loadedData}
            pages={pages} handleQueryChange={handleQueryChange} query={query}
            isLoading={isLoading} setTilesPerPage={setTilesPerPage}
            handleEntitySelected={handleEntitySelected} setPages={setPages}
            selectedEntity={selectedEntity} onFilterChange={handleFilterChange}
          />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["vault.details"]}
          name="vault.details"
          onStopResize={handleResized}
        >
          <Details selectedEntity={selectedEntity} onRefresh={handleRefresh} />
        </ReflexElement>
      </ReflexContainer>
    </Modal>
  )
}

export default Vault;

import React, { useEffect, useState, useContext } from "react"
import styles from "./Browser.module.css"
import Box from "@mui/material/Box"
import AssetTile from "./AssetTile"
import Divider from "@mui/material/Divider"
import CollectionTree from "./CollectionTree"
import TopBar from "./TopBar"
import PageBar from "../../components/PageBar"
import { LinearProgress } from "@mui/material"
import debounce from "lodash.debounce"
import { useSnackbar } from "notistack"
import serverRequest from "../../services/serverRequest"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import FilterBar from "./FilterBar"
import { Typography } from "@mui/material"
import Modal from "../../components/Modal"

const debounced = debounce(fn => fn(), 500)

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const defaultFlexRations = {
  "browser.collections": 0.2,
  "browser.browser": 0.8
}

// const assets = Array.from(Array(20)).map(() => (
//   JSON.parse('{"ok": true, "data": {"name_safe": "crateB", "supporting_files_dir": "/asset_library/3d/asset_library/.store/edf36efe8258/v001/supporting_files", "description": "", "tags": "", "media": {"renders": [{"index": 0, "last": 1100, "mapping": "mapping_v5", "caption": "", "frames": 100, "path": "/asset_library/3d/asset_library/.store/edf36efe8258/media/m0/render_rec709.####.png", "first": 1001}, {"index": 1, "last": 1100, "mapping": "mapping_v5", "caption": "", "frames": 100, "path": "/asset_library/3d/asset_library/.store/edf36efe8258/media/m1/render_rec709.####.png", "first": 1001}], "thumbnail": "https://i.imgur.com/hzMEMSd.png"}, "asset_dir": "/asset_library/3d/asset_library/.store/edf36efe8258", "components_dir": "/asset_library/3d/asset_library/.store/edf36efe8258/v001/components", "project": "mountain_dew_project_pink_e004288", "public_dir": "/asset_library/3d/asset_library/assets/crateB", "auto_tags": "", "components": [{"name": "model", "file": "/asset_library/3d/asset_library/.store/edf36efe8258/v001/components/model/model.abc"}, {"name": "look", "file": "/asset_library/3d/asset_library/.store/edf36efe8258/v001/components/look/look.otl"}], "media_dir": "/asset_library/3d/asset_library/.store/edf36efe8258/media", "filter_string": "crateb crateb edf36efe8258 model look  mountain_dew_project_pink_e004288 ", "config_dir": "/asset_library/3d/asset_library/.store/edf36efe8258/config.yaml", "id": "edf36efe8258", "name": "crateB"}}')
// ));

const EmptyBrowserBg = props => {
  const style = {
    pointerEvents: "none",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
  return (
    <div style={style}>
      <Typography variant="h2" style={{color: "rgb(50, 50, 50)"}}>
        {props.loading ? "Please wait..." : "No results"}
      </Typography>
    </div>
  )
}

function Browser(props) {
  const [refreshValue, setRefreshValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedAssets, setLoadedAssets] = useState([])
  const [pages, setPages] = useState({total: 1, current: 1})
  const [query, setQuery] = useState({filter_string: ""})
  const [tileSize, setTileSize] = useState(200)
  const [tilesPerPage, setTilesPerPage] = useState(50)
  const [selectedAsset, setSelectedAsset] = useState({})
  const [tiles, setTiles] = useState([])
  const [aspectRatio, setAspectRatio] = useState(1)
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations)
  const [studioCollectionData, setStudioCollectionData] = useState([])
  const [userCollectionData, setUserCollectionData] = useState([])
  const [selectedCollection, setSelectedCollection] = useState("")
  const [autoPlay, setAutoPlay] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [user, setUser] = useState("")
  const [assetDeleteModal, setAssetDeleteModal] = useState({open: false})
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  useEffect(() => {
    const selectedCollection = localStorage.getItem("selectedCollection")
    handleCollectionChange(selectedCollection || "studio:/all")
  }, [])

  useEffect(() => {
    serverRequest("get_collections", {user: user}).then(resp => {
      const data = resp.data
      setStudioCollectionData(data && data.studio ? data.studio : [])
      setUserCollectionData(data && data.user ? data.user : [])
    })
  }, [refreshValue, user])

  const handleAssetSelected = (asset) => {
    setSelectedAsset(asset)
    props.setCurrentAsset(asset)
  }

  useEffect(() => {
    const data = {
      page: pages.current,
      limit: tilesPerPage,
      query: query
    }
    setIsLoading(true)
    serverRequest("get_assets", data).then(resp => {
      setIsLoading(false)
      setLoadedAssets(resp.data)
      setPages((prevPages) => ({...prevPages, total: resp.pages.total, results: resp.pages.results}))
    })
  }, [pages.current, refreshValue, props.refreshValue, query, tilesPerPage, selectedCollection])

  useEffect(() => {
    const _tiles = loadedAssets.reduce(function(obj, asset) {
      if (asset.id === selectedAsset.id) handleAssetSelected(asset)
      obj[asset.id] = 
        <AssetTile
          key={asset.id}
          onAssetDelete={() => setAssetDeleteModal({
            open: true,
            assetID: asset.id
          })}
          onAssetEdit={props.onAssetEdit}
          asset={asset}
          aspectRatio={aspectRatio}
          autoPlay={autoPlay} onSelected={handleAssetSelected}
          selected={asset.id === selectedAsset.id}
          size={tileSize}
        />
      return obj
    }, {})
    setTiles(_tiles)
  }, [loadedAssets, selectedAsset, aspectRatio, autoPlay, tileSize])

  const handleQueryChange = newQuery => {
    setQuery(prevState => ({...prevState, ...newQuery}))
    setPages(prevState => ({...prevState, current: 1}))
  }

  const forceUpdate = () => {
    setRefreshValue((prevRefresh) => (prevRefresh + 1))
  }

  const handlePageChange = (event, value) => {
    setPages(prevPages => ({...prevPages, current: value}))
  }

  const getColourNameCluster = (word, words) => {
    const index = words.indexOf(word)

  }

  // const getColoursFromString = s => {
  //   const words = s.toLowerCase().split(" ")
  //   let colours = []
  //   words.map(word => {
  //     const matches = namedColors.filter(c => c.name.toLowerCase() === word)
  //     if (matches) colours = colours.concat(matches)
  //   })
  //   return colours
  // }

  const handleFilterChange = (event) => {
    setIsLoading(true)
    const value = event.target.value
    const filter_string = value === undefined ? "" : value
    debounced(() => {
      // const palette = getColoursFromString(filter_string);
      const palette = []
      handleQueryChange({filter_string: filter_string, palette: palette})
    }
    )
  }

  const handleTilesPerPageChange = (event) => {
    setTilesPerPage(parseInt(event.target.value))
  }

  const handleTileSizeChange = (event) => {
    setTileSize(event.target.value * 40)
  }

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
    gridGap: "10px",
    padding: "10px",
    paddingTop: "5px"
  }

  const handleCollectionChange = coll => {
    setSelectedCollection(coll)
    handleQueryChange({collection: coll})
    localStorage.setItem("selectedCollection", coll)
  }

  const handleExpressionChange = expression => {
    handleQueryChange({expression: expression})
  }

  const handleAssetDelete = assetID => {
    setAssetDeleteModal({open: false})
    serverRequest("delete_asset", {data: assetID}).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"})
      else enqueueSnackbar("There was an error deleting the asset.", {variant: "error"})
    })
    forceUpdate()
  }

  const getBrowserHelperText = () => {
    let s = `${pages.results} results | `
    s += query.sort ? `Sorted by: ${query.sort.label}` : ""
    s += ` | Collection: ${selectedCollection}`
    return s
  }

  return (
    <div className={styles.container}>
      <Modal title="Are you sure you want to delete this asset?" maxWidth="sm" closeButton buttonLabel="Confirm" onButtonClicked={() => handleAssetDelete(assetDeleteModal.assetID)} open={assetDeleteModal.open} onClose={() => setAssetDeleteModal({open: false})} />
      <TopBar onRefresh={forceUpdate} onAssetEdit={props.onAssetEdit} onFilterChange={handleFilterChange} setQuery={handleQueryChange} onFiltersToggle={() => setFiltersOpen(prevState => !prevState)} autoPlay={autoPlay} onAutoPlayChange={e => setAutoPlay(e.target.checked)} />
      <Divider />
      <LinearProgress color="ignite" style={{width: "100%", minHeight: "4px", visibility: isLoading ? "visible" : "hidden"}} />
      <div className={styles.collectionsBrowserContainer}>
        <DndProvider backend={HTML5Backend}>
          <div className={styles.collectionContainer}>
            <CollectionTree collectionData={studioCollectionData} onRefresh={forceUpdate} user={undefined} selectedCollection={selectedCollection} setSelectedCollection={handleCollectionChange} />
          </div>
          <Divider orientation="vertical" />
          <div className={styles.browserContainer}>
            <div style={{width: "100%"}}>
              <FilterBar open={filtersOpen} setOpen={setFiltersOpen} onExpressionChanged={handleExpressionChange} />
              <div className={styles.helperTextContainer}>
                <Typography variant="caption" style={{color: "grey"}}>
                  {getBrowserHelperText()}
                </Typography>
              </div>
              {loadedAssets.length ?
                <Box className={styles.tileContainer} style={tileContainerStyle}>
                  {Object.keys(tiles).map((k) => tiles[k])}
                </Box> :
                <EmptyBrowserBg loading={isLoading} />
              }
              <div className={styles.layoutHelper} />
            </div>
          </div>
        </DndProvider>
      </div>
      <Divider />
      <PageBar pages={pages.total} currentPage={pages.current} onChange={handlePageChange} onAspectRatioChange={setAspectRatio} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={handleTileSizeChange} />
    </div>
  )
}

export default Browser

import React, { useEffect, useState, useContext } from "react";
import styles from "./Browser.module.css";
import Box from "@mui/material/Box";
import AssetTile from "./AssetTile";
import Divider from "@mui/material/Divider";
import TopBar from "./TopBar";
import PageBar from "../../components/PageBar";
import { LinearProgress } from "@mui/material";
import debounce from "lodash.debounce";
import { useSnackbar } from "notistack";
import serverRequest from "../../services/serverRequest";
import FilterBar from "./FilterBar";
import { Typography } from "@mui/material";
import Modal from "../../components/Modal";
import DataPlaceholder from "../../components/DataPlaceholder";

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

function Browser(props) {
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadedAssets, setLoadedAssets] = useState([])
  const [tileSize, setTileSize] = useState(200)
  const [tilesPerPage, setTilesPerPage] = useState(50)
  const [selectedAsset, setSelectedAsset] = useState({})
  const [tiles, setTiles] = useState([])
  const [aspectRatio, setAspectRatio] = useState(1)
  const [autoPlay, setAutoPlay] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [assetDeleteModal, setAssetDeleteModal] = useState({open: false})
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()

  const pages = props.pages;
  const query = props.query;

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
      props.setPages((prevPages) => ({...prevPages, total: resp.pages.total, results: resp.pages.results}))
    })
  }, [pages.current, props.refreshValue, query, tilesPerPage, props.selectedCollection])

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

  const forceUpdate = () => {
    props.setRefreshValue(prevState => (prevState + 1))
  }

  const handlePageChange = (event, value) => {
    props.setPages(prevPages => ({...prevPages, current: value}))
  }

  // const getColourNameCluster = (word, words) => {
  //   const index = words.indexOf(word)
  // }

  // const getColoursFromString = s => {
  //   const words = s.toLowerCase().split(" ")
  //   let colours = []
  //   words.map(word => {
  //     const matches = namedColors.filter(c => c.name.toLowerCase() === word)
  //     if (matches) colours = colours.concat(matches)
  //   })
  //   return colours
  // }

  const handleFilterChange = value => {
    setIsLoading(true);
    const filter_string = value === undefined ? "" : value;
    debounced(() => {
      // const palette = getColoursFromString(filter_string);
      const palette = [];
      props.handleQueryChange({filter_string: filter_string, palette: palette})
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

  const handleExpressionChange = expression => {
    props.handleQueryChange({expression: expression})
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
    s += ` | Collection: ${props.selectedCollection}`
    return s
  }

  return (
    <div className={styles.container}>
      <Modal title="Are you sure you want to delete this asset?" maxWidth="sm" closeButton buttonLabel="Confirm" onButtonClicked={() => handleAssetDelete(assetDeleteModal.assetID)} open={assetDeleteModal.open} onClose={() => setAssetDeleteModal({open: false})} />
      <TopBar onRefresh={forceUpdate} onAssetEdit={props.onAssetEdit} onFilterChange={handleFilterChange} setQuery={props.handleQueryChange} onFiltersToggle={() => setFiltersOpen(prevState => !prevState)} autoPlay={autoPlay} onAutoPlayChange={e => setAutoPlay(e.target.checked)} />
      <Divider />
      <LinearProgress color="ignite" style={{width: "100%", minHeight: "4px", visibility: isLoading ? "visible" : "hidden"}} />
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
            <DataPlaceholder text={isLoading ? "Please wait..." : "No results"} />
          }
          <div className={styles.layoutHelper} />
        </div>
      </div>
      <Divider />
      <PageBar pages={pages.total} currentPage={pages.current} onChange={handlePageChange} onAspectRatioChange={setAspectRatio} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={handleTileSizeChange} />
    </div>
  )
}

export default Browser

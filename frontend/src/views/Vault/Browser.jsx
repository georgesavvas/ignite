import React, { useEffect, useState, useContext } from "react";
import styles from "./Browser.module.css";
import Box from "@mui/material/Box";
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
import AssetTile from "./AssetTile";

const debounced = debounce(fn => fn(), 500)

function Browser(props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  // const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [aspectRatio, setAspectRatio] = useState(1);
  const [tileSize, setTileSize] = useState(200);
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    const _tiles = props.loadedAssets.reduce(function(obj, asset) {
      if (asset.id === props.selectedAsset.id) props.handleAssetSelected(asset)
      obj[asset.id] = 
        <AssetTile
          key={asset.id}
          // onAssetDelete={() => setAssetDeleteModal({
          //   open: true,
          //   assetID: asset.id
          // })}
          // onAssetEdit={props.onAssetEdit}
          asset={asset}
          aspectRatio={aspectRatio} onSelected={props.handleAssetSelected}
          selected={asset.id === props.selectedAsset.id}
          size={tileSize}
        />
      return obj
    }, {})
    setTiles(_tiles)
  }, [props.loadedAssets, props.selectedAsset, aspectRatio, tileSize])

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
    props.setIsLoading(true);
    const filter_string = value === undefined ? "" : value;
    debounced(() => {
      // const palette = getColoursFromString(filter_string);
      const palette = [];
      props.handleQueryChange({filter_string: filter_string, palette: palette})
    }
    )
  }

  const handlePageChange = (event, value) => {
    props.setPages(prevPages => ({...prevPages, current: value}))
  }

  const handleTilesPerPageChange = (event) => {
    props.setTilesPerPage(parseInt(event.target.value))
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

  // const handleAssetDelete = assetID => {
  //   setAssetDeleteModal({open: false})
  //   serverRequest("delete_asset", {data: assetID}).then(resp => {
  //     if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"})
  //     else enqueueSnackbar("There was an error deleting the asset.", {variant: "error"})
  //   })
  //   forceUpdate()
  // }

  const getBrowserHelperText = () => {
    let s = `${props.pages.results} results | `
    s += props.query.sort ? `Sorted by: ${props.query.sort.label}` : ""
    s += ` | Collection: ${props.selectedCollection}`
    return s
  }

  return (
    <div className={styles.container}>
      <TopBar onRefresh={props.onRefresh}
        onFilterChange={handleFilterChange} setQuery={props.handleQueryChange}
        onFiltersToggle={() => setFiltersOpen(prevState => !prevState)}
      />
      <Divider />
      <LinearProgress color="ignite"
        style={{
          width: "100%",
          minHeight: "4px",
          visibility: props.isLoading ? "visible" : "hidden"
        }}
      />
      <div className={styles.browserContainer}>
        <div style={{width: "100%"}}>
          <FilterBar open={filtersOpen} setOpen={setFiltersOpen}
            onExpressionChanged={handleExpressionChange}
          />
          <div className={styles.helperTextContainer}>
            <Typography variant="caption" style={{color: "grey"}}>
              {getBrowserHelperText()}
            </Typography>
          </div>
          {props.loadedAssets.length ?
            <Box className={styles.tileContainer} style={tileContainerStyle}>
              {Object.keys(tiles).map((k) => tiles[k])}
            </Box> :
            <DataPlaceholder
              text={props.isLoading ? "Please wait..." : "No results"}
            />
          }
          <div className={styles.layoutHelper} />
        </div>
      </div>
      <Divider />
      <PageBar pages={props.pages.total} currentPage={props.pages.current}
        onChange={handlePageChange} onAspectRatioChange={setAspectRatio}
        onTilesPerPageChange={handleTilesPerPageChange}
        onTileSizeChange={handleTileSizeChange}
      />
    </div>
  )
}

export default Browser

import React, {useEffect, useState, useContext} from "react";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

import TopBar from "./TopBar";
import PageBar from "../../components/PageBar";
import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "../Explorer/AssetTile";
import DirectoryTile from "../Explorer/DirectoryTile";
import {ConfigContext} from "../../contexts/ConfigContext";
import styles from "./Browser.module.css";
import FilterBar from "./FilterBar";
import BuildFileURL from "../../services/BuildFileURL";


const defaultExplorerSettings = {
  currentTileSize: 5,
  tilesPerPage: 50
};

function Browser(props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [explorerSettings] = useState(defaultExplorerSettings);
  const [tileSize, setTileSize] = useState(200);
  const [tiles, setTiles] = useState([]);
  const [config] = useContext(ConfigContext);

  useEffect(() => {
    const _tiles = props.loadedData.reduce(function(obj, entity) {
      if (entity.path === props.selectedEntity.path) props.handleEntitySelected(entity);
      entity.path = BuildFileURL(entity.path, config, {pathOnly: true});
      if (entity.components) {
        entity.components.forEach(comp => {
          comp.path = BuildFileURL(comp.path, config, {pathOnly: true});
        });
      }
      if (entity.task) entity.task = BuildFileURL(entity.task, config, {pathOnly: true});
      if (entity.dir_kind === "assetversion") {
        obj[entity.result_id] = <AssetTile key={entity.result_id}
          entity={entity}
          onSelected={props.handleEntitySelected}
          size={explorerSettings.currentTileSize * 40}
          viewType="grid"
          selected={props.selectedEntity.path === entity.path}
          refreshContext={props.onRefresh}
          // onContextMenu={handleContextMenuSelection}
        />;
      } else {
        obj[entity.result_id] = <DirectoryTile key={entity.result_id}
          entity={entity}
          onSelected={props.handleEntitySelected}
          size={explorerSettings.currentTileSize * 40}
          viewType="grid"
          selected={props.selectedEntity.path === entity.path}
          refreshContext={props.onRefresh}
          // onContextMenu={handleContextMenuSelection}
        />;
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [props.loadedData, props.selectedEntity.path, explorerSettings.currentViewType, explorerSettings.currentTileSize]);

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

  const handleFilterChange = data => {
    props.onFilterChange(data);
    // const palette = getColoursFromString(filter_string);
    // const palette = [];
  };

  const handlePageChange = (event, value) => {
    props.setPages(prevPages => ({...prevPages, current: value}));
  };

  const handleTilesPerPageChange = (event) => {
    props.setTilesPerPage(parseInt(event.target.value));
  };

  const handleTileSizeChange = (event) => {
    setTileSize(event.target.value * 40);
  };

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
    gridGap: "10px",
    padding: "10px",
    paddingTop: "5px"
  };

  const handleFilterStringChange = value => {
    props.handleQueryChange({filter_string: value});
  };

  // const handleAssetDelete = assetID => {
  //   setAssetDeleteModal({open: false})
  //   serverRequest("delete_asset", {data: assetID}).then(resp => {
  //     if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"})
  //     else enqueueSnackbar("There was an error deleting the asset.", {variant: "error"})
  //   })
  //   forceUpdate()
  // }

  const getBrowserHelperText = () => {
    let s = `${props.pages.results} results | `;
    s += props.query.sort ? `Sorted by: ${props.query.sort.label}` : "";
    s += ` | Collection: ${props.selectedCollection.path}`;
    return s;
  };

  return (
    <div className={styles.container}>
      <TopBar onRefresh={props.onRefresh}
        onFilterStringChange={handleFilterStringChange} setQuery={props.handleQueryChange}
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
            onFilterChange={handleFilterChange}
          />
          <div className={styles.helperTextContainer}>
            <Typography variant="caption" style={{color: "grey"}}>
              {getBrowserHelperText()}
            </Typography>
          </div>
          {props.loadedData.length ?
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
        onChange={handlePageChange}
        onTilesPerPageChange={handleTilesPerPageChange}
        onTileSizeChange={handleTileSizeChange} tileSize={explorerSettings.currentTileSize}
      />
    </div>
  );
}

export default Browser;

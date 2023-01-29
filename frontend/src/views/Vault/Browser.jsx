// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useEffect, useState, useContext} from "react";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import {useSnackbar} from "notistack";

import TopBar from "./TopBar";
import PageBar from "../../components/PageBar";
import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "./AssetTile";
import {ConfigContext} from "../../contexts/ConfigContext";
import styles from "./Browser.module.css";
import FilterBar from "./FilterBar";
import BuildFileURL from "../../services/BuildFileURL";
import {DeleteDir, RenameDir, VaultExport} from "../ContextActions";


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
  const [modalData, setModalData] = useState({});
  const {enqueueSnackbar} = useSnackbar();

  useEffect(() => {
    if (!props.loadedData) return;
    const _tiles = props.loadedData.reduce(function(obj, entity) {
      if (entity.path === props.selectedEntity.path) {
        props.handleEntitySelected(entity);
      }
      entity.path = BuildFileURL(entity.path, config, {pathOnly: true});
      if (entity.components) {
        entity.components.forEach(comp => {
          comp.path = BuildFileURL(comp.path, config, {pathOnly: true});
        });
      }
      obj[entity.result_id] = <AssetTile key={entity.result_id}
        entity={entity}
        onSelected={props.handleEntitySelected}
        size={explorerSettings.currentTileSize * 40}
        viewType="grid"
        selected={props.selectedEntity.path === entity.path}
        refreshContext={props.onRefresh}
        handleContextMenuSelection={handleContextMenuSelection}
      />;
      return obj;
    }, {});
    setTiles(_tiles);
  }, [props.loadedData, props.selectedEntity.path,
    explorerSettings.currentViewType, explorerSettings.currentTileSize]);

  const handleContextMenuSelection = (action, _data) => {
    const data = {..._data};
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const handleFilterChange = data => {
    props.onFilterChange(data);
  };

  const handlePageChange = (event, value) => {
    props.setPages(prevPages => ({...prevPages, current: value}));
  };

  const handleTilesPerPageChange = (event) => {
    props.setTilesPerPage(parseInt(event.target.value) || 50);
  };

  const handleTileSizeChange = (event) => {
    setTileSize(event.target.value * 40);
  };

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
    gridGap: "5px",
    padding: "5px",
    paddingTop: "5px"
  };

  const handleFilterStringChange = value => {
    props.handleQueryChange({filter_string: value});
  };

  const getBrowserHelperText = () => {
    let s = `${props.pages.results} results | `;
    s += props.query.sort ? `Sorted by: ${props.query.sort.label}` : "";
    s += ` | Collection: ${props.selectedCollection}`;
    return s;
  };

  return (
    <div className={styles.container}>
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prev => ({...prev, deleteOpen: false}))}
        data={modalData} fn={props.onRefresh}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prev => ({...prev, renameOpen: false}))}
        data={modalData} fn={props.onRefresh}
      />
      <VaultExport open={modalData.vaultExportOpen}
        onClose={() => setModalData(prev => ({...prev, vaultExportOpen: false}))}
        data={modalData} fn={props.onRefresh} enqueueSnackbar={enqueueSnackbar}
      />
      <TopBar onRefresh={props.onRefresh} setQuery={props.handleQueryChange}
        onFilterStringChange={handleFilterStringChange}
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
          {props.loadedData && props.loadedData.length ?
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
      <PageBar pages={props.pages?.total} currentPage={props.pages.current}
        onChange={handlePageChange} tileSize={explorerSettings.currentTileSize}
        onTilesPerPageChange={handleTilesPerPageChange}
        onTileSizeChange={handleTileSizeChange}
      />
    </div>
  );
}

export default Browser;

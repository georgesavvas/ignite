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


import React, {useEffect, useState, useContext} from "react";

import Divider from "@mui/material/Divider";
import debounce from "lodash.debounce";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import {useSnackbar} from "notistack";

import BuildFileURL from "../../services/BuildFileURL";
import {ConfigContext} from "../../contexts/ConfigContext";
import DataPlaceholder from "../../components/DataPlaceholder";
import {DIRCONTEXTOPTIONS} from "../../constants";
import {
  CopyToClipboard,
  ShowInExplorer,
  VaultExport,
  VaultImport
} from "../ContextActions";
import loadExplorerSettings from "../../utils/loadExplorerSettings";
import saveExplorerSettings from "../../utils/saveExplorerSettings";
import ContextMenu, {handleContextMenu} from "../../components/ContextMenu";
import ExplorerBar from "./ExplorerBar";
import PageBar from "../../components/PageBar";
import {EntityContext} from "../../contexts/EntityContext";
import {ContextContext} from "../../contexts/ContextContext";
import {DeleteDir, RenameDir, CreateDir} from "../ContextActions";
import serverRequest from "../../services/serverRequest";
import classes from "./Explorer.module.css";
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";
import RowView from "./RowView";
import Modal from "../../components/Modal";
import DccSelector from "../DccSelector";
import DragOverlay from "../../components/DragOverlay";
import SceneDrop from "./SceneDrop";


const debounced = debounce(fn => fn(), 500);

const defaultExplorerSettings = {
  currentResultType: "dynamic",
  currentViewType: "grid",
  currentTileSize: 5,
  tilesPerPage: 50,
  saved: {
    dynamic: {
      grid: 5,
      row: 5,
      current: "grid"
    },
    tasks: {
      grid: 5,
      row: 5,
      current: "grid"
    },
    assets: {
      grid: 5,
      row: 5,
      current: "grid"
    },
    scenes: {
      grid: 5,
      row: 5,
      current: "grid"
    }
  }
};

const defaultQuery = {
  latest: 1,
  sort: {
    field: "modification_ts",
    reverse: true,
    label: "Date (Newest first)"
  }
};

function Explorer() {
  const [config] = useContext(ConfigContext);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState(defaultQuery);
  const savedExplorerSettings = loadExplorerSettings();
  const [explorerSettings, setExplorerSettings] = useState(
    savedExplorerSettings || defaultExplorerSettings
  );
  const [tiles, setTiles] = useState([]);
  const [modalData, setModalData] = useState({});
  const [dropData, setDropData] = useState({visible: false});
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);
  const [currentContext,, refreshContext] = useContext(ContextContext);
  const [newSceneOpen, setNewSceneOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const {enqueueSnackbar} = useSnackbar();

  const methods = {
    dynamic: "get_contents",
    tasks: "get_tasks",
    assets: "get_assetversions",
    scenes: "get_scenes"
  };

  const handleEntitySelection = (entity) => {
    setSelectedEntity(entity);
  };

  const handleContextMenuSelection = (action, _data) => {
    const data = {..._data};
    data[`${action}Open`] = true;
    setModalData(data);
  };

  useEffect(() => {
    saveExplorerSettings(explorerSettings);
  }, [explorerSettings]);

  useEffect(() => {
    if (!config.ready) return;
    const data = {
      page: pages.current,
      limit: explorerSettings.tilesPerPage,
      path: BuildFileURL(
        currentContext.path, config, {reverse: true, pathOnly: true}
      ),
      query: query
    };
    const method = methods[explorerSettings.currentResultType];
    setIsLoading(true);
    setDropData({visible: false});
    serverRequest(method, data).then(resp => {
      setIsLoading(false);
      setLoadedData(resp.data);
      setPages(prevPages => ({...prevPages, total: resp.pages?.total}));
    });
  }, [
    pages.current, explorerSettings.currentResultType,
    explorerSettings.tilesPerPage, currentContext, config.ready, query
  ]);

  useEffect(() => {
    if (!loadedData) return;
    const fetchedSelected = loadedData.find(
      entity => entity.path === selectedEntity.path
    );
    if (fetchedSelected) setSelectedEntity(fetchedSelected);
    if (explorerSettings.currentViewType !== "grid") return;
    const _tiles = loadedData.reduce(function(obj, entity) {
      entity.path = BuildFileURL(entity.path, config, {pathOnly: true});
      if (entity.components) {
        entity.components.forEach(comp => {
          comp.path = BuildFileURL(comp.path, config, {pathOnly: true});
        });
      }
      if (entity.task) {
        entity.task = BuildFileURL(entity.task, config, {pathOnly: true});
      }
      if (entity.scene) {
        entity.scene = BuildFileURL(entity.scene, config, {pathOnly: true});
      }
      if (entity.dir_kind === "assetversion") {
        obj[entity.result_id] = <AssetTile key={entity.path} entity={entity}
          onSelected={handleEntitySelection} refreshContext={refreshContext}
          size={explorerSettings.currentTileSize * 40}
          viewType={explorerSettings.currentViewType}
          selected={selectedEntity.path === entity.path}
          handleContextMenuSelection={handleContextMenuSelection}
        />;
      } else {
        obj[entity.result_id] = <DirectoryTile key={entity.path} entity={entity}
          onSelected={handleEntitySelection}
          selected={selectedEntity.path === entity.path}
          handleContextMenuSelection={handleContextMenuSelection}
          size={explorerSettings.currentTileSize * 40}
          refreshContext={refreshContext}
          viewType={explorerSettings.currentViewType}
        />;
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [
    loadedData, selectedEntity.path, explorerSettings.currentViewType,
    explorerSettings.currentTileSize
  ]);

  useEffect(() => {
    setPages((prevPages) => ({...prevPages, current: 1}));
  }, [query, explorerSettings.tilesPerPage]);

  const handlePageChange = (e, value) => {
    setPages((prevPages) => ({...prevPages, current: value}));
  };

  const handleFilterChange = value => {
    setIsLoading(true);
    debounced(
      () => setQuery((prevState) => ({...prevState, filter_string: value}))
    );
  };

  const handleTilesPerPageChange = value => {
    setExplorerSettings(prevState => ({
      ...prevState,
      tilesPerPage: parseInt(value) || 50
    }));
  };

  const handleResultTypeChange = value => {
    const savedViewType = explorerSettings.saved[value]?.current || "grid";
    const savedTileSize = explorerSettings.saved[value]?.[savedViewType] || 5;
    setExplorerSettings(prevState => {
      return {
        ...prevState,
        currentResultType: value,
        currentViewType: savedViewType,
        currentTileSize: savedTileSize
      };
    });
  };

  const handleViewTypeChange = value => {
    const currentResultType = explorerSettings.currentResultType || "grid";
    const savedTileSize =
      explorerSettings.saved[currentResultType]?.[value] || 5;
    setExplorerSettings(prevState => {
      const saved = prevState.saved ?? defaultExplorerSettings.saved;
      saved[currentResultType].current = value;
      return {
        ...prevState,
        saved: saved,
        currentViewType: value,
        currentTileSize: savedTileSize
      };
    });
  };

  const handleTileSizeChange = value => {
    const currentResultType = explorerSettings.currentResultType;
    const currentViewType = explorerSettings.currentViewType;
    setExplorerSettings(prevState => {
      const saved = prevState.saved;
      saved[currentResultType][currentViewType] = value;
      return {
        ...prevState,
        currentTileSize: value
      };
    });
  };

  const handleLatestChange = e => {
    setQuery(prevState => ({...prevState, latest: e.target.checked}));
  };

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `
      repeat(auto-fill, minmax(${explorerSettings.currentTileSize * 40}px, 1fr))
    `,
    gridGap: "3px",
    padding: "0px 5px"
  };

  if (explorerSettings.currentViewType === "row") {
    tileContainerStyle.gridTemplateColumns = "repeat(1, 1fr)";
  }

  function getGenericContextItems(data, enqueueSnackbar) {
    return [
      {
        label: "Copy path",
        fn: () =>  CopyToClipboard(data.path, enqueueSnackbar)
      },
      {
        label: "Open in file explorer",
        fn: () => ShowInExplorer(data.path, enqueueSnackbar),
        divider: true
      },
      {
        label: "Import asset from Vault",
        fn: () =>  data.handleClick("vaultExport", data),
        divider: true
      },
      {
        label: "Rename",
        fn: () => data.handleClick("rename", data)
      },
      {
        label: "Delete",
        fn: () => data.handleClick("delete", data),
        divider: true
      }
    ];
  }

  const handleClick = (action, data) => {
    handleContextMenuSelection(action, data);
    handleClose();
  };

  const handleClose = () => {
    setContextMenu(null);
  };
  
  function getSpecificContextItems(data) {
    if (!(data.kind in DIRCONTEXTOPTIONS)) return [];
    const kindOptions = DIRCONTEXTOPTIONS[data.kind];
    const namedOptions = kindOptions[data.name] || kindOptions.default;
    return namedOptions.map(contextOption => ({
      label: contextOption.label,
      value: contextOption.name,
      dir_path: data.path,
      fn: () => data.handleClick(
        "create",
        {...data, method: contextOption.name, kind: contextOption.dir_kind}
      )
    }));
  }

  const itemData = {
    path: currentContext.path,
    kind: currentContext.dir_kind,
    name: currentContext.name,
    handleClick: handleClick
  };

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));
  if (currentContext.dir_kind === "task") {
    const newSceneItem = {
      label: "New Scene",
      fn: () =>  setNewSceneOpen(true)
    };
    contextItems.push(newSceneItem);
  }

  const getBrowserHelperText = () => {
    const amount = loadedData ? loadedData.length : 0;
    const single = amount === 1 ? "" : "s";
    let s = `${amount} result${single} | `;
    s += query.sort ? `Sorted by: ${query.sort.label}` : "";
    return s;
  };

  const getView = () => {
    if (dropData.visible) return;
    if (!loadedData || !loadedData.length) return (
      <DataPlaceholder text={isLoading ? "Fetching data..." : "No results"} />
    );
    if (explorerSettings.currentViewType == "row") return (
      <RowView data={loadedData} page={pages.current}
        tileSize={explorerSettings.currentTileSize}
        pageSize={explorerSettings.tilesPerPage}
        resultType={explorerSettings.currentResultType}
        selectedEntityPath={selectedEntity.path}
        onSelected={handleEntitySelection}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
        handleContextMenuSelection={handleContextMenuSelection}
      />
    );
    return (
      <div style={tileContainerStyle}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
    );
  };

  const handleNewScene = () => setNewSceneOpen(true);

  const handleDeleteDir = deletedEntityPath => {
    if (deletedEntityPath === selectedEntity.path) setSelectedEntity({});
    refreshContext();
  };

  const handlePaste = e => {
    if (currentContext.dir_kind != "task") {
      setDropData({visible: false});
      return;
    }
    const cb = e.clipboardData;
    const files = cb.files;
    if (!files) return;
    const sceneFiles = filterScenesFromFiles(files);
    if (sceneFiles.length) {
      setDropData({visible: false, scenes: sceneFiles});
      return;
    }
    setDropData({visible: false, files: files});
  };

  const handleDragEnd = e => {
    e.preventDefault();
    e.stopPropagation();
    setDropData({visible: false});
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt.files;
    if (!files) return;
    const data = {visible: true};
    if (currentContext.dir_kind != "task") {
      data.error = "Current directory not a task";
    }
    setDropData(data);
  };

  const fileInDCCConfig = file => {
    return config.dccConfig.some(dcc =>
      dcc.scenes.some(ext =>
        file.path.endsWith(`.${ext.trim()}`)
      )
    );
  };

  const filterScenesFromFiles = files => {
    return [...files].filter(file => fileInDCCConfig(file));
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    if (currentContext.dir_kind != "task") {
      setDropData({visible: false});
      return;
    }
    const dt = e.dataTransfer;
    const sceneFiles = filterScenesFromFiles(dt.files);
    if (sceneFiles.length > 0) {
      setDropData({visible: false, scenes: sceneFiles, all: [...dt.files]});
      return;
    }
    setDropData({visible: false, files: dt.files});
  };

  const clearDroppedFiles = () => {
    setDropData({visible: false});
  };

  const handleSceneDropClose = remaining => {
    if (!remaining || remaining.length === 0) setDropData({visible: false});
    else setDropData(prev => {
      return ({
        visible: false,
        files: remaining || prev.all
      });
    });
  };

  return (
    <div className={classes.container}>
      <Modal
        maxWidth="xs"
        open={newSceneOpen}
        onClose={() => setNewSceneOpen(false)}
      >
        <DccSelector newScene={true} task={currentContext.path}
          onClose={() => setNewSceneOpen(false)}
        />
      </Modal>
      <SceneDrop files={dropData}
        onClose={handleSceneDropClose}
      />
      <CreateDir open={modalData.createOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState =>
          ({...prevState, createOpen: false}))
        }
        data={modalData} fn={refreshContext}
      />
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState =>
          ({...prevState, deleteOpen: false}))
        }
        data={modalData} fn={() => handleDeleteDir(modalData.path)}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState =>
          ({...prevState, renameOpen: false}))
        }
        data={modalData} fn={refreshContext}
      />
      <VaultImport open={modalData.vaultImportOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() =>
          setModalData(prevState => ({...prevState, vaultImportOpen: false}))
        }
        data={modalData} fn={refreshContext}
      />
      <VaultExport open={modalData.vaultExportOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() =>
          setModalData(prevState => ({...prevState, vaultExportOpen: false}))
        }
        data={modalData} fn={refreshContext}
      />
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu} title={currentContext.name}
        subtitle={currentContext.dir_kind}
      />
      <ExplorerBar onFilterChange={handleFilterChange}
        resultType={explorerSettings.currentResultType}
        onResultTypeChange={handleResultTypeChange}
        viewType={explorerSettings.currentViewType}
        onLatestChange={handleLatestChange}
        onViewTypeChange={handleViewTypeChange}
        onNewScene={handleNewScene}
        enqueueSnackbar={enqueueSnackbar}
        setQuery={setQuery}
        droppedFiles={dropData.files}
        clearDroppedFiles={clearDroppedFiles}
      />
      <Divider />
      <LinearProgress color="ignite"
        style={{
          width: "100%",
          minHeight: "2px",
          visibility: isLoading ? "visible" : "hidden"
        }}
      />
      <div className={classes.helperTextContainer}>
        <Typography variant="caption" style={{color: "grey"}}>
          {getBrowserHelperText()}
        </Typography>
      </div>
      <div onPaste={handlePaste} onDragLeave={handleDragEnd} onDrop={handleDrop}
        onDragEnd={handleDragEnd} onDragOver={handleDragOver} style={{position: "relative", height: "100%"}}
      >
        {dropData.visible ?
          <DragOverlay text="Create asset" error={dropData.error} />
          : null
        }
        {getView()}
      </div>
      <div
        className={classes.layoutHelper}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
        onPaste={handlePaste} onDragLeave={handleDragEnd} onDrop={handleDrop}
        onDragEnd={handleDragEnd} onDragOver={handleDragOver}
      />
      <Divider />
      <PageBar
        pages={pages.total}
        onChange={handlePageChange}
        tileSize={explorerSettings.currentTileSize}
        onTilesPerPageChange={e => handleTilesPerPageChange(e.target.value)}
        onTileSizeChange={e => handleTileSizeChange(e.target.value)}
      />
    </div>
  );
}

export default Explorer;

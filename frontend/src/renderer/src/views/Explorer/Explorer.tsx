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

import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { EnqueueSnackbar, IgniteComponent, IgniteEntity } from "@renderer/types/common";
import { debounce } from "lodash";
import { useSnackbar } from "notistack";
import React, { ChangeEvent, ClipboardEvent, useContext, useEffect, useState } from "react";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import DataPlaceholder from "../../components/DataPlaceholder";
import DragOverlay from "../../components/DragOverlay";
import Modal from "../../components/Modal";
import { DIRCONTEXTOPTIONS } from "../../constants/directoryContextOptions";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { EntityContext, EntityContextType } from "../../contexts/EntityContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import loadExplorerSettings from "../../utils/loadExplorerSettings";
import saveExplorerSettings from "../../utils/saveExplorerSettings";
import { CopyToClipboard, ShowInExplorer, VaultExport, VaultImport } from "../ContextActions";
import { CreateDir, DeleteDir, RenameDir } from "../ContextActions";
import DccSelector from "../DccSelector";
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";
import styles from "./Explorer.module.css";
import ExplorerBar from "./ExplorerBar";
import PageBar from "./PageBar";
import RowView from "./RowView";
import SceneDrop from "./SceneDrop";

const debounced = debounce((fn: () => void) => fn(), 500);

const defaultExplorerSettings = {
  currentResultType: "dynamic",
  currentViewType: "grid",
  currentTileSize: 5,
  tilesPerPage: 50,
  saved: {
    dynamic: {
      grid: 5,
      row: 5,
      current: "grid",
    },
    tasks: {
      grid: 5,
      row: 5,
      current: "grid",
    },
    assets: {
      grid: 5,
      row: 5,
      current: "grid",
    },
    scenes: {
      grid: 5,
      row: 5,
      current: "grid",
    },
  },
};

export type QueryType = {
  latest: -1 | 1;
  sort: {
    field: string;
    reverse: boolean;
    label: string;
  };
};

const defaultQuery = {
  latest: 1,
  sort: {
    field: "modification_ts",
    reverse: true,
    label: "Date (Newest first)",
  },
} as QueryType;

const Explorer = () => {
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({ total: 1, current: 1 });
  const [query, setQuery] = useState(defaultQuery);
  const savedExplorerSettings = loadExplorerSettings();
  const [explorerSettings, setExplorerSettings] = useState(
    savedExplorerSettings || defaultExplorerSettings
  );
  const [tiles, setTiles] = useState([]);
  const [modalData, setModalData] = useState({});
  const [dropData, setDropData] = useState({ visible: false });
  const { selectedEntity, setSelectedEntity } = useContext(EntityContext) as EntityContextType;
  const { currentContext, refresh } = useContext(ContextContext) as ContextContextType;
  const [newSceneOpen, setNewSceneOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const methods = {
    dynamic: "get_contents",
    tasks: "get_tasks",
    assets: "get_assetversions",
    scenes: "get_scenes",
  };

  const handleEntitySelection = (entity: IgniteEntity) => {
    setSelectedEntity(entity);
  };

  const handleContextMenuSelection = (action: string, _data: any) => {
    const data = { ..._data };
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
      path: BuildFileURL(currentContext.path, config, { reverse: true, pathOnly: true }),
      query: query,
    };
    const method = methods[explorerSettings.currentResultType as keyof typeof methods];
    setIsLoading(true);
    setDropData({ visible: false });
    serverRequest(method, data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
      setPages((prevPages) => ({ ...prevPages, total: resp.pages?.total }));
    });
  }, [
    pages.current,
    explorerSettings.currentResultType,
    explorerSettings.tilesPerPage,
    currentContext,
    config.ready,
    query,
  ]);

  useEffect(() => {
    if (!loadedData) return;
    const fetchedSelected = loadedData.find(
      (entity: IgniteEntity) => entity.path === selectedEntity.path
    );
    if (fetchedSelected) setSelectedEntity(fetchedSelected);
    if (explorerSettings.currentViewType !== "grid") return;
    const _tiles = loadedData.reduce((obj, entity: IgniteEntity) => {
      entity.path = BuildFileURL(entity.path, config, { pathOnly: true });
      if (entity.components) {
        entity.components.forEach((comp: IgniteComponent) => {
          comp.path = BuildFileURL(comp.path, config, { pathOnly: true });
        });
      }
      if (entity.task) {
        entity.task = BuildFileURL(entity.task, config, { pathOnly: true });
      }
      if (entity.scene) {
        entity.scene = BuildFileURL(entity.scene, config, { pathOnly: true });
      }
      if (entity.dir_kind === "assetversion") {
        obj[entity.result_id] = (
          <AssetTile
            key={entity.path}
            entity={entity}
            onSelected={handleEntitySelection}
            refreshContext={refresh}
            size={explorerSettings.currentTileSize * 40}
            viewType={explorerSettings.currentViewType}
            selected={selectedEntity.path === entity.path}
            handleContextMenuSelection={handleContextMenuSelection}
          />
        );
      } else {
        obj[entity.result_id] = (
          <DirectoryTile
            key={entity.path}
            entity={entity}
            onSelected={handleEntitySelection}
            selected={selectedEntity.path === entity.path}
            handleContextMenuSelection={handleContextMenuSelection}
            size={explorerSettings.currentTileSize * 40}
            refreshContext={refresh}
            viewType={explorerSettings.currentViewType}
          />
        );
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [
    loadedData,
    selectedEntity.path,
    explorerSettings.currentViewType,
    explorerSettings.currentTileSize,
  ]);

  useEffect(() => {
    setPages((prevPages) => ({ ...prevPages, current: 1 }));
  }, [query, explorerSettings.tilesPerPage]);

  const handlePageChange = (e: ChangeEvent<unknown>, value: number) => {
    setPages((prevPages) => ({ ...prevPages, current: value }));
  };

  const handleFilterChange = (value: string) => {
    setIsLoading(true);
    debounced(() => setQuery((prev) => ({ ...prev, filter_string: value })));
  };

  const handleTilesPerPageChange = (value: string) => {
    setExplorerSettings((prev: typeof defaultExplorerSettings) => ({
      ...prev,
      tilesPerPage: parseInt(value) || 50,
    }));
  };

  const handleResultTypeChange = (value: string) => {
    const savedViewType = explorerSettings.saved[value]?.current || "grid";
    const savedTileSize = explorerSettings.saved[value]?.[savedViewType] || 5;
    setExplorerSettings((prev: typeof defaultExplorerSettings) => {
      return {
        ...prev,
        currentResultType: value,
        currentViewType: savedViewType,
        currentTileSize: savedTileSize,
      };
    });
  };

  const handleViewTypeChange = (value: string) => {
    const currentResultType = explorerSettings.currentResultType || "grid";
    const savedTileSize = explorerSettings.saved[currentResultType]?.[value] || 5;
    setExplorerSettings((prev: typeof defaultExplorerSettings) => {
      const saved = prev.saved ?? defaultExplorerSettings.saved;
      saved[currentResultType as keyof typeof saved].current = value;
      return {
        ...prev,
        saved: saved,
        currentViewType: value,
        currentTileSize: savedTileSize,
      };
    });
  };

  const handleTileSizeChange = (value: string) => {
    const currentResultType = explorerSettings.currentResultType;
    const currentViewType = explorerSettings.currentViewType;
    setExplorerSettings((prev: typeof defaultExplorerSettings) => {
      const saved = prev.saved;
      saved[currentResultType as keyof typeof saved][currentViewType] = value;
      return {
        ...prev,
        currentTileSize: value,
      };
    });
  };

  const handleLatestChange = (e) => {
    setQuery((prev) => ({ ...prev, latest: e.target.checked }));
  };

  const tileContainerStyle = {
    gridTemplateColumns: `
      repeat(auto-fill, minmax(${explorerSettings.currentTileSize * 40}px, 1fr))
    `,
  } as React.CSSProperties;

  if (explorerSettings.currentViewType === "row") {
    tileContainerStyle.gridTemplateColumns = "repeat(1, 1fr)";
  }

  const getGenericContextItems = (data: any, enqueueSnackbar: EnqueueSnackbar) => {
    return [
      {
        label: "Copy path",
        fn: () => CopyToClipboard(data.path, enqueueSnackbar),
      },
      {
        label: "Open in file explorer",
        fn: () => ShowInExplorer(data.path, enqueueSnackbar),
        divider: true,
      },
      {
        label: "Import asset from Vault",
        fn: () => data.handleClick("vaultExport", data),
        divider: true,
      },
      {
        label: "Rename",
        fn: () => data.handleClick("rename", data),
      },
      {
        label: "Delete",
        fn: () => data.handleClick("delete", data),
        divider: true,
      },
    ];
  };

  const handleClick = (action: string, data: any) => {
    handleContextMenuSelection(action, data);
    handleClose();
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const getSpecificContextItems = (data: any) => {
    if (!(data.kind in DIRCONTEXTOPTIONS)) return [];
    const kindOptions = DIRCONTEXTOPTIONS[data.kind as keyof typeof DIRCONTEXTOPTIONS];
    const namedOptions = kindOptions[data.name] || kindOptions.default;
    return namedOptions.map((contextOption) => ({
      label: contextOption.label,
      value: contextOption.name,
      dir_path: data.path,
      fn: () =>
        data.handleClick("create", {
          ...data,
          method: contextOption.name,
          kind: contextOption.dir_kind,
        }),
    }));
  };

  const itemData = {
    path: currentContext.path,
    kind: currentContext.dir_kind,
    name: currentContext.name,
    handleClick: handleClick,
  };

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));
  if (currentContext.dir_kind === "task") {
    const newSceneItem = {
      label: "New Scene",
      fn: () => setNewSceneOpen(true),
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
    if (!loadedData || !loadedData.length)
      return <DataPlaceholder text={isLoading ? "Fetching data..." : "No results"} />;
    if (explorerSettings.currentViewType == "row")
      return (
        <RowView
          data={loadedData}
          page={pages.current}
          tileSize={explorerSettings.currentTileSize}
          pageSize={explorerSettings.tilesPerPage}
          resultType={explorerSettings.currentResultType}
          selectedEntityPath={selectedEntity.path}
          onSelected={handleEntitySelection}
          onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
          handleContextMenuSelection={handleContextMenuSelection}
        />
      );
    return (
      <div
        className={styles.tileContainer}
        style={tileContainerStyle}
        onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
    );
  };

  const handleNewScene = () => setNewSceneOpen(true);

  const handleDeleteDir = (deletedEntityPath: string) => {
    if (deletedEntityPath === selectedEntity.path) setSelectedEntity({});
    refresh();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
    if (currentContext.dir_kind != "task") {
      setDropData({ visible: false });
      return;
    }
    const cb = e.clipboardData;
    if (cb === null) return;
    const files = cb.files;
    if (!files) return;
    const sceneFiles = filterScenesFromFiles(files);
    if (sceneFiles.length) {
      setDropData({ visible: false, scenes: IgniteSceneFiles });
      return;
    }
    setDropData({ visible: false, files: files });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropData({ visible: false });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    const files = dt.files;
    if (!files) return;
    const data = { visible: true };
    if (currentContext.dir_kind != "task") {
      data.error = "Current directory not a task";
    }
    setDropData(data);
  };

  const fileInDCCConfig = (file: File) => {
    return config.dccConfig.some((dcc) =>
      dcc.scenes.some((ext: string) => file.path.endsWith(`.${ext.trim()}`))
    );
  };

  const filterScenesFromFiles = (files: FileList) => {
    return [...files].filter((file) => fileInDCCConfig(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentContext.dir_kind != "task") {
      setDropData({ visible: false });
      return;
    }
    const dt = e.dataTransfer;
    const sceneFiles = filterScenesFromFiles(dt.files);
    if (sceneFiles.length > 0) {
      setDropData({ visible: false, scenes: IgniteSceneFiles, all: [...dt.files] });
      return;
    }
    setDropData({ visible: false, files: dt.files });
  };

  const clearDroppedFiles = () => {
    setDropData({ visible: false });
  };

  const handleSceneDropClose = (remaining: FileList) => {
    if (!remaining || remaining.length === 0) setDropData({ visible: false });
    else
      setDropData((prev) => {
        return {
          visible: false,
          files: remaining || prev.all,
        };
      });
  };

  return (
    <div className={styles.container}>
      <Modal maxWidth="xs" open={newSceneOpen} onClose={() => setNewSceneOpen(false)}>
        <DccSelector
          newScene={true}
          task={currentContext.path}
          onClose={() => setNewSceneOpen(false)}
        />
      </Modal>
      <SceneDrop files={dropData} onClose={handleSceneDropClose} />
      <CreateDir
        open={modalData.createOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, createOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <DeleteDir
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, deleteOpen: false }))}
        data={modalData}
        fn={() => handleDeleteDir(modalData.path)}
      />
      <RenameDir
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, renameOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <VaultImport
        open={modalData.vaultImportOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, vaultImportOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <VaultExport
        open={modalData.vaultExportOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, vaultExportOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <ContextMenu
        items={contextItems}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        title={currentContext.name}
        subtitle={currentContext.dir_kind}
      />
      <ExplorerBar
        onFilterChange={handleFilterChange}
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
      <LinearProgress
        color="ignite"
        style={{
          width: "100%",
          minHeight: "2px",
          visibility: isLoading ? "visible" : "hidden",
        }}
      />
      <div className={styles.helperTextContainer}>
        <Typography variant="caption" style={{ color: "grey" }}>
          {getBrowserHelperText()}
        </Typography>
      </div>
      <div
        onPaste={handlePaste}
        onDragLeave={handleDragEnd}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
        style={{
          position: "relative",
          height: "100%",
          overflow: "auto",
        }}
      >
        {dropData.visible ? <DragOverlay text="Create asset" error={dropData.error} /> : null}
        {getView()}
      </div>
      <Divider />
      <PageBar
        pages={pages.total}
        onChange={handlePageChange}
        tileSize={explorerSettings.currentTileSize}
        tilesPerPage={explorerSettings.tilesPerPage}
        onTilesPerPageChange={(e) => handleTilesPerPageChange(e.target.value)}
        onTileSizeChange={(e) => handleTileSizeChange(e.target.value)}
      />
    </div>
  );
};

export default Explorer;

import React, {useEffect, useState, useContext} from "react";
import classes from "./Explorer.module.css";
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";
import Divider from '@mui/material/Divider';
import ExplorerBar from "./ExplorerBar";
import PageBar from "./PageBar";
import {EntityContext} from "../../contexts/EntityContext";
import {ContextContext} from "../../contexts/ContextContext";
import { DeleteDir, RenameDir, CreateDir } from "../ContextActions";
import serverRequest from "../../services/serverRequest";
import debounce from 'lodash.debounce';
import { DIRCONTEXTOPTIONS } from "../../constants";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import loadExplorerSettings from "../../utils/loadExplorerSettings";
import saveExplorerSettings from "../../utils/saveExplorerSettings";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import { LinearProgress } from "@mui/material";
import { useSnackbar } from 'notistack';
import BuildFileURL from "../../services/BuildFileURL";
import { ConfigContext } from "../../contexts/ConfigContext";


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
}

function Explorer() {
  const [config, setConfig] = useContext(ConfigContext);
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({latest: 1, sort: {field: "name", reverse: false}});
  const [explorerSettings, setExplorerSettings] = useState(defaultExplorerSettings);
  const [tiles, setTiles] = useState([]);
  const [modalData, setModalData] = useState({});
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const methods = {
    dynamic: "get_contents",
    assets: "get_assetversions",
    scenes: "get_scenes"
  }

  const handleEntitySelection = (entity) => {
    setSelectedEntity(entity);
  }

  const handleContextMenuSelection = (action, data) => {
    data[`${action}Open`] = true;
    setModalData(data);
  };

  useEffect(() => {
    const data = loadExplorerSettings();
    if (!data) return;
    setExplorerSettings(data);
  }, []);

  useEffect(() => {
    saveExplorerSettings(explorerSettings);
  }, [explorerSettings])

  useEffect(() => {
    const data = {
      page: pages.current,
      limit: explorerSettings.tilesPerPage,
      path: BuildFileURL(currentContext.path, config, {reverse: true, pathOnly: true}),
      query: query
    };
    const method = methods[explorerSettings.currentResultType];
    setIsLoading(true);
    if (!Object.entries(config.access).length) return;
    serverRequest(method, data).then(resp => {
      setIsLoading(false);
      setLoadedData(resp.data);
      setPages((prevPages) => ({...prevPages, total: resp.pages.total}));
    });
  }, [pages.current, explorerSettings.currentResultType, explorerSettings.tilesPerPage, refreshValue, currentContext, config.access, query]);

  // useEffect(() => {
  //   if (!selectedEntity) return;
  //   loadedData.forEach(entity => {
  //     if (entity.path === selectedEntity.path) setSelectedEntity(entity);
  //   })
  // }, [loadedData]);

  useEffect(() => {
    const _tiles = loadedData.reduce(function(obj, entity) {
      if (entity.path === selectedEntity.path) setSelectedEntity(entity);
      entity.path = BuildFileURL(entity.path, config, {pathOnly: true});
      if (entity.components) {
        entity.components.forEach(comp => {
          comp.path = BuildFileURL(comp.path, config, {pathOnly: true});
        })
      }
      if (entity.task) entity.task = BuildFileURL(entity.task, config, {pathOnly: true});
      if (entity.scene) entity.scene = BuildFileURL(entity.scene, config, {pathOnly: true});
      if (entity.dir_kind === "assetversion") {
        obj[entity.result_id] = <AssetTile key={entity.result_id} entity={entity}
          onSelected={handleEntitySelection} size={explorerSettings.currentTileSize * 40} viewType={explorerSettings.currentViewType}
          selected={selectedEntity.path === entity.path} refreshContext={refreshContext}
          onContextMenu={handleContextMenuSelection}
        />;
      } else {
        obj[entity.result_id] = <DirectoryTile key={entity.result_id} entity={entity}
          onSelected={handleEntitySelection} size={explorerSettings.currentTileSize * 40} viewType={explorerSettings.currentViewType}
          selected={selectedEntity.path === entity.path} refreshContext={refreshContext}
          onContextMenu={handleContextMenuSelection}
        />;
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [loadedData, selectedEntity.path, explorerSettings.currentViewType, explorerSettings.currentTileSize])

  const forceUpdate = () => {
    setRefreshValue((prevRefresh) => (prevRefresh + 1))
  }

  const handlePageChange = (e, value) => {
    setPages((prevPages) => ({...prevPages, current: value}));
  };

  const handleFilterChange = value => {
    setIsLoading(true);
    debounced(() => setQuery((prevState) => ({...prevState, filter_string: value})));
  }

  const handleTilesPerPageChange = value => {
    setExplorerSettings(prevState => ({...prevState, tilesPerPage: value}))
  };

  const handleResultTypeChange = value => {
    const savedViewType = explorerSettings.saved[value].current;
    const savedTileSize = explorerSettings.saved[value][savedViewType];
    setExplorerSettings(prevState => {
      return {
        ...prevState,
        currentResultType: value,
        currentViewType: savedViewType,
        currentTileSize: savedTileSize
      }
    })
  };

  const handleViewTypeChange = value => {
    const currentResultType = explorerSettings.currentResultType;
    const savedTileSize = explorerSettings.saved[currentResultType][value];
    setExplorerSettings(prevState => {
      const saved = prevState.saved;
      saved[currentResultType].current = value;
      return {
        ...prevState,
        saved: saved,
        currentViewType: value,
        currentTileSize: savedTileSize
      }
    })
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
      }
    })
  }

  const handleLatestChange = e => {
    setQuery(prevState => ({...prevState, latest: e.target.checked}))
  }

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${explorerSettings.currentTileSize * 40}px, 1fr))`,
    gridGap: "10px",
    padding: "10px"
  }

  if (explorerSettings.currentViewType === "row") {
    tileContainerStyle.gridTemplateColumns = `repeat(1, 1fr)`;
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
        label: "Rename",
        fn: () => data.handleClick("rename", data)
      },
      {
        label: "Delete",
        fn: () => data.handleClick("delete", data),
        divider: true
      }
    ]
  }

  const handleClick = (action, data) => {
    handleContextMenuSelection(action, data);
    handleClose();
  }

  const handleClose = () => {
    setContextMenu(null);
  };
  
  function getSpecificContextItems(data) {
    if (!(data.kind in DIRCONTEXTOPTIONS)) return [];
    return DIRCONTEXTOPTIONS[data.kind].map(contextOption => (
      {
        label: contextOption.label,
        value: contextOption.name,
        dir_path: data.path,
        fn: () => data.handleClick(
          "create", {...data, method: contextOption.name, kind: contextOption.dir_kind}
        )
      }
    ))
  }

  const itemData = {
    path: currentContext.path,
    kind: currentContext.dir_kind,
    // name: labelText,
    handleClick: handleClick
  }

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));

  return (
    <div className={classes.container}>
      <CreateDir open={modalData.createOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, createOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, deleteOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, renameOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <ExplorerBar
        onRefresh={forceUpdate}
        onFilterChange={handleFilterChange}
        resultType={explorerSettings.currentResultType}
        onResultTypeChange={handleResultTypeChange}
        viewType={explorerSettings.currentViewType}
        onLatestChange={handleLatestChange}
        onViewTypeChange={handleViewTypeChange}
        enqueueSnackbar={enqueueSnackbar}
        setQuery={setQuery}
      />
      <Divider />
      <LinearProgress color="ignite" style={{width: "100%", minHeight: "2px", visibility: isLoading ? "visible" : "hidden"}} />
      <div
        style={tileContainerStyle}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
      <div
        className={classes.layoutHelper}
        onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      />
      <Divider />
      <PageBar pages={pages.total} onChange={handlePageChange} tileSize={explorerSettings.currentTileSize} onTilesPerPageChange={e => handleTilesPerPageChange(e.target.value)} onTileSizeChange={e => handleTileSizeChange(e.target.value)}/>
    </div>
  )
}

export default Explorer;

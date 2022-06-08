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
import loadExplorerSettings from "../../utils/loadExplorerSettings";
import saveExplorerSettings from "../../utils/saveExplorerSettings";
import { LinearProgress } from "@mui/material";
import { useSnackbar } from 'notistack';

const debounced = debounce(fn => fn(), 500);

const defaultViewType = "grid";
const defaultTileSize = 5;

function Explorer() {
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({latest: 1});
  const [explorerSettings, setExplorerSettings] = useState("dynamic");
  const [tileSize, setTileSize] = useState(defaultTileSize);
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [resultType, setResultType] = useState("dynamic");
  const [viewType, setViewType] = useState(defaultViewType);
  const [tiles, setTiles] = useState([]);
  const [modalData, setModalData] = useState({});
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
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
    setTilesPerPage(data.tilesPerPage || 50);
    setViewType(data.viewType[resultType] || defaultViewType);
    setTileSize(data.tileSize[resultType][viewType[resultType]] || defaultTileSize);
  }, []);

  useEffect(() => {
    const data = {
      resultType: resultType,
      viewType: viewType,
      tileSize: tileSize
    }
    const settings = saveExplorerSettings(data);
    setExplorerSettings(settings);
  }, [resultType, viewType, tileSize])

  useEffect(() => {
    const data = {
      page: pages.current,
      limit: tilesPerPage,
      path: currentContext.path,
      query: query
    };
    const method = methods[resultType];
    setIsLoading(true);
    serverRequest(method, data).then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data);
      setPages((prevPages) => ({...prevPages, total: resp.pages.total}));
    });
  }, [pages.current, resultType, refreshValue, currentContext, tilesPerPage, query]);

  useEffect(() => {
    const _tiles = loadedData.reduce(function(obj, entity) {
      if (entity.dir_kind === "assetversion") {
        obj[entity.result_id] = <AssetTile key={entity.result_id} entity={entity}
          onSelected={handleEntitySelection} size={tileSize * 40} viewType={viewType}
          selected={selectedEntity.path === entity.path} refreshContext={refreshContext}
          onContextMenu={handleContextMenuSelection}
        />;
      } else {
        obj[entity.result_id] = <DirectoryTile key={entity.result_id} entity={entity}
          onSelected={handleEntitySelection} size={tileSize * 40} viewType={viewType}
          selected={selectedEntity.path === entity.path} refreshContext={refreshContext}
          onContextMenu={handleContextMenuSelection}
        />;
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [loadedData, selectedEntity, viewType, tileSize])

  const forceUpdate = () => {
    setRefreshValue((prevRefresh) => (prevRefresh + 1))
  }

  const handlePageChange = (e, value) => {
    setPages((prevPages) => ({...prevPages, current: value}));
  };

  const handleFilterChange = e => {
    setIsLoading(true);
    const value = e.target.value;
    debounced(() => setQuery((prevState) => ({...prevState, filter_string: value})));
  }

  const handleTilesPerPageChange = e => {
    setTilesPerPage(parseInt(e.target.value));
  }

  const handleResultTypeChange = value => {
    setResultType(value);
    const view = explorerSettings.viewType[value];
    setViewType(view || defaultViewType);
    setTileSize(explorerSettings.tileSize[value][view] || defaultTileSize);
  }

  const handleViewTypeChange = value => {
    setViewType(value || defaultViewType);
    setTileSize(explorerSettings.tileSize[resultType][value] || defaultTileSize);
  }

  const handleLatestChange = e => {
    setQuery(prevState => ({...prevState, latest: e.target.checked}))
  }

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize * 40}px, 1fr))`,
    gridGap: "10px",
    padding: "10px"
  }

  if (viewType === "row") {
    tileContainerStyle.gridTemplateColumns = `repeat(1, 1fr)`;
  }

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
      <ExplorerBar
        onRefresh={forceUpdate}
        onFilterChange={handleFilterChange}
        resultType={resultType}
        onResultTypeChange={handleResultTypeChange}
        viewType={viewType}
        onLatestChange={handleLatestChange}
        onViewTypeChange={handleViewTypeChange}
        enqueueSnackbar={enqueueSnackbar}
      />
      <Divider />
      <LinearProgress color="ignite" style={{width: "100%", minHeight: "2px", visibility: isLoading ? "visible" : "hidden"}} />
      <div style={tileContainerStyle}>
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
      <div className={classes.layoutHelper} />
      <Divider />
      <PageBar pages={pages.total} onChange={handlePageChange} tileSize={tileSize} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={e => setTileSize(e.target.value)}/>
    </div>
  )
}

export default Explorer;

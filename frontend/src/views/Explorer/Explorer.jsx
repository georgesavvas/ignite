import React, {useEffect, useState, useContext} from "react";
import classes from "./Explorer.module.css";
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";
import Divider from '@mui/material/Divider';
import ExplorerBar from "./ExplorerBar";
import PageBar from "./PageBar";
import {EntityContext} from "../../contexts/EntityContext";
import {ContextContext} from "../../contexts/ContextContext";
import serverRequest from "../../services/serverRequest";
import debounce from 'lodash.debounce';

function Explorer() {
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({latest: 1});
  const [tileSize, setTileSize] = useState(200);
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [resultType, setResultType] = useState("dynamic");
  const [viewType, setViewType] = useState("grid");
  const [tiles, setTiles] = useState([]);
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  const methods = {
    dynamic: "get_contents",
    assets: "get_assetversions",
    scenes: "get_scenes"
  }

  const handleEntitySelection = (entity) => {
    setSelectedEntity(entity);
  }

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
        obj[entity.result_id] = <AssetTile key={entity.result_id} entity={entity} onSelected={handleEntitySelection} selected={selectedEntity.path === entity.path} size={tileSize} viewType={viewType} />;
      } else {
        obj[entity.result_id] = <DirectoryTile key={entity.result_id} entity={entity} onSelected={handleEntitySelection} selected={selectedEntity.path === entity.path} size={tileSize} viewType={viewType} />;
      }
      return obj;
    }, {});
    setTiles(_tiles);
  }, [loadedData, selectedEntity, viewType, tileSize])

  const forceUpdate = (event, value) => {
    setRefreshValue((prevRefresh) => (prevRefresh + 1))
  }

  const handlePageChange = (event, value) => {
    setPages((prevPages) => ({...prevPages, current: value}));
  };

  const updateFilter = debounce(value => {
    setQuery((prevState) => ({...prevState, filter_string: value}));
  }, 250);

  const handleFilterChange = e => {
    updateFilter(e.target.value);
  }

  const handleTilesPerPageChange = (event) => {
    setTilesPerPage(parseInt(event.target.value));
  }

  const handleTileSizeChange = (event) => {
    setTileSize(event.target.value * 40);
  }

  const handleLatestChange = e => {
    setQuery(prevState => ({...prevState, latest: e.target.checked}))
  }

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
    gridGap: "10px",
    padding: "10px"
  }

  if (viewType === "row") {
    tileContainerStyle.gridTemplateColumns = `repeat(1, 1fr)`;
  }

  return (
    <div className={classes.container}>
      <ExplorerBar
        onRefresh={forceUpdate}
        onFilterChange={handleFilterChange}
        resultType={resultType}
        onResultTypeChange={setResultType}
        viewType={viewType}
        onLatestChange={handleLatestChange}
        onViewTypeChange={setViewType}
      />
      <Divider />
      <div style={tileContainerStyle}>
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
      <div className={classes.layoutHelper} />
      <Divider />
      <PageBar pages={pages.total} onChange={handlePageChange} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={handleTileSizeChange}/>
    </div>
  )
}

export default Explorer;

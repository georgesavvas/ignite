import React, {useEffect, useState, useContext} from "react";
import classes from "./Explorer.module.css";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import ExplorerBar from "./ExplorerBar";
import PageBar from "./PageBar";
import {EntityContext} from "../contexts/EntityContext";
import {ContextContext} from "../contexts/ContextContext";

function Explorer() {
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({filter_string: ""});
  const [tileSize, setTileSize] = useState(200);
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [resultType, setResultType] = useState("dynamic");
  const [viewType, setViewType] = useState("grid");
  const [latest, setLatest] = useState(0);
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
      latest: latest
    };
    setIsLoading(true);
    fetch(
      `http://127.0.0.1:5000/api/v1/${methods[resultType]}`, {
        method: "POST",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )
      .then((resp) => {
        return resp.json();
      })
      .then((resp) => {
        setIsLoading(false);
        setLoadedData(resp.data);
        setPages((prevPages) => ({...prevPages, total: resp.pages.total}));
      });
  }, [pages.current, resultType, refreshValue, currentContext, tilesPerPage, latest]);

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

  const handleFilterChange = (event) => {
    const value = event.target.value;
    const filter_string = value === undefined ? "" : value;
    setQuery((prevQuery) => ({...prevQuery, filter_string: filter_string}));
  }

  const handleTilesPerPageChange = (event) => {
    setTilesPerPage(parseInt(event.target.value));
  }

  const handleTileSizeChange = (event) => {
    setTileSize(event.target.value * 40);
  }

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fit, minmax(${tileSize}px, 1fr))`,
    // gridGap: `${tileSize * 0.06}px`,
    // padding: `${tileSize * 0.06}px`
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
        onLatestChange={e => setLatest(e.target.checked)}
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

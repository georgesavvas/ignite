import React, {useEffect, useState, useContext} from "react";
import classes from "./Explorer.module.css";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import AssetTile, {HiddenTile} from "./AssetTile";
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import ExplorerBar from "./ExplorerBar";
import PageBar from "./PageBar";
import {ContextContext} from "../contexts/ContextContext";

function Explorer() {
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({filter_string: ""});
  const [tileSize, setTileSize] = useState(100);
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedEntity, setSelectedEntity] = useState({});
  const [resultType, setResultType] = useState("dynamic");
  const [viewType, setViewType] = useState("grid");
  const [latest, setLatest] = useState(0);
  const [currentContext, setCurrentContext] = useContext(ContextContext);
  // const [tiles, setTiles] = useState([]);

  const methods = {
    dynamic: "get_contents",
    assets: "get_assetversions",
    scenes: "get_scenes"
  }

  const handleEntitySelection = (entity) => {
    setSelectedEntity(entity)
    console.log(entity.name, "was selected!")
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
        // const _tiles = resp.data.reduce(function(obj, asset) {
        // obj[asset.result_id] = <AssetTile key={asset.result_id} asset={asset} onSelected={handleEntitySelection} selected={selectedEntity.path == asset.path} size={tileSize} viewType={viewType} />;
        // return obj;
        // }, {});
        // setTiles(_tiles);
      });
  }, [pages.current, resultType, refreshValue, currentContext, tilesPerPage, latest]);

  var tiles = {};
  var hiddenTiles = {}
  if (isLoading) {
      {tiles = [...Array(tilesPerPage).keys()].reduce(function(obj, index) {
        obj[index] = <Skeleton key={index} variant="rectangular" animation="wave" className={classes.skeleton}>
            <Paper elevation={3} style={{borderRadius: "10px", width: tileSize, height: tileSize * 0.5625}} />
          </Skeleton>
        return obj;
      }, {});}
  } else {
    {
      tiles = loadedData.reduce(function(obj, asset) {
      obj[asset.result_id] = <AssetTile key={asset.result_id} asset={asset} onSelected={handleEntitySelection} selected={selectedEntity.path == asset.path} size={tileSize} viewType={viewType} />;
      return obj;
      }, {});
      for (var i = 0; i < 10; i++) {
        hiddenTiles[`_${i}`] = <HiddenTile key={`_${i}`} size={tileSize} />;
      }
      tiles = {...tiles, ...hiddenTiles};
    }
  }

  // if (!isLoading) {
  //   const _tiles = loadedData.reduce(function(obj, asset) {
  //   obj[asset.result_id] = <AssetTile key={asset.result_id} asset={asset} onSelected={handleEntitySelection} selected={selectedEntity.path == asset.path} size={tileSize} viewType={viewType} />;
  //   return obj;
  //   }, {});
  //   setTiles(_tiles);
  // }

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
    "flexDirection": viewType == "grid" ? "row" : "column",
    "flexWrap": viewType == "grid" ? "wrap" : "nowrap",
    "justifyContent": viewType == "grid" ? "space-evenly" : "flex-start",
    "gap": (tileSize * 0.5625 * 0.1).toString() + "px"
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
      <Box className={classes.tileContainer} style={tileContainerStyle}>
        {Object.keys(tiles).map((k) => tiles[k])}
      </Box>
      <Divider />
      <PageBar pages={pages.total} onChange={handlePageChange} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={handleTileSizeChange}/>
    </div>
  )
}

export default Explorer;

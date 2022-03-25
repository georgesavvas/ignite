import React, {useEffect, useState, useContext} from "react";
import classes from "./Explorer.module.css";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import AssetTile, {HiddenTile} from "./AssetTile";
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
// import FilterBar from "./FilterBar";
// import PageBar from "./PageBar";
import {ContextContext} from "../contexts/ContextContext";

function Explorer() {
  const [refreshValue, setRefreshValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedData, setLoadedData] = useState([]);
  const [pages, setPages] = useState({total: 1, current: 1});
  const [query, setQuery] = useState({filter_string: ""});
  const [tileSize, setTileSize] = useState(100);
  const [tilesPerPage, setTilesPerPage] = useState(50);
  const [selectedAsset, setSelectedAsset] = useState({});
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  const handleAssetSelected = (asset) => {
    setSelectedAsset(asset)
    console.log(asset.name, "was selected!")
  }

  useEffect(() => {
    const data = {
      page: pages.current,
      limit: tilesPerPage,
      path: currentContext.path
    };
    setIsLoading(true);
    fetch(
      "http://127.0.0.1:5000/api/v1/get_contents", {
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
        console.log(resp.data);
        // setPages((prevPages) => ({...prevPages, total: resp.pages.total}));
      });
  }, [pages.current, refreshValue, currentContext, tilesPerPage]);

  var tiles = {};
  var hiddenTiles = {}
  if (isLoading) {
      {tiles = [...Array(tilesPerPage).keys()].reduce(function(obj, index) {
        obj[index] = <Skeleton key={index} variant="rectangular" animation="wave" className={classes.skeleton}>
            <Paper elevation={3} style={{borderRadius: "20px", width: tileSize, height: tileSize}} />
          </Skeleton>
        return obj;
      }, {});}
  } else {
    {
      tiles = loadedData.reduce(function(obj, asset) {
      obj[asset.id] = <AssetTile key={asset.result_id} asset={asset} onSelected={handleAssetSelected} selectedAsset={selectedAsset} size={tileSize}/>;
      return obj;
      }, {});
      // for (var i = 0; i < 10; i++) {
      //   hiddenTiles[`_${i}`] = <HiddenTile key={`_${i}`} size={tileSize} />;
      // }
      // tiles = {...tiles, ...hiddenTiles};
    }
  }

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

  const style = {
    "width": "200px",
    "height": "200px"
  }

  return (
    <div className={classes.container}>
      {/* <FilterBar onRefresh={forceUpdate} onFilterChange={handleFilterChange} /> */}
      <Divider />
      <Box className={classes.tileContainer}>
        {Object.keys(tiles).map((k) => tiles[k])}
      </Box>
      <Divider />
      {/* <PageBar pages={pages.total} onChange={handlePageChange} onTilesPerPageChange={handleTilesPerPageChange} onTileSizeChange={handleTileSizeChange}/> */}
    </div>
  )
}

export default Explorer;

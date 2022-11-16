// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, { useState, useMemo, useContext } from "react";

import {DataGrid} from "@mui/x-data-grid";
import { Typography } from "@mui/material";

import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "./AssetTile";
import URI from "../../components/URI";
import DirectoryTile from "./DirectoryTile";
import {ContextContext} from "../../contexts/ContextContext";
import { useEffect } from "react";


const RowView = props => {
  const [, setCurrentContext] = useContext(ContextContext);
  const [selectionModel, setSelectionModel] = useState([]);

  useEffect(() => {
    const selectedIndex = props.data.findIndex(
      entity => entity.path === props.selectedEntityPath
    );
    setSelectionModel(selectedIndex > -1 ? [selectedIndex] : []);
  }, [props.data]);

  const renderEntity = params => {
    switch (params.value.dir_kind) {
    default:
      return useMemo(() =>
        <DirectoryTile
          onContextMenu={props.onContextMenu}
          entity={params.value}
          noInfo
          noBorder
          noOverlay
        />, [params.value]
      );
    case "assetversion":
      return useMemo(() =>
        <AssetTile
          onContextMenu={props.onContextMenu}
          entity={params.value}
          noInfo
          noBorder
          noOverlay
        />, [params.value]
      );
    }
  };

  const renderUri = params => {
    return (
      <URI uri={params.value} style={{pointerEvents: "none"}} />
    );
  };

  const renderText = params => {
    return (
      <Typography>{params.value}</Typography>
    );
  };

  const specificColumns = {
    dynamic: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.1,
        renderCell: renderText
      },
      {
        index: 2,
        field: "version",
        headerName: "Version",
        flex: 0.1,
        renderCell: renderText
      },
      {
        index: 3,
        field: "dir_kind",
        headerName: "Dir Kind",
        flex: 0.1,
        renderCell: renderText
      },
      {
        index: 4,
        field: "dcc",
        headerName: "DCC",
        flex: 0.1,
        renderCell: renderText
      }
    ],
    assets: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.25,
        renderCell: renderText
      },
      {
        index: 2,
        field: "version",
        headerName: "Version",
        flex: 0.08,
        renderCell: renderText
      },
      {
        index: 3, 
        field: "uri", 
        headerName: "URI", 
        flex: 0.4,
        renderCell: renderUri,
        sortComparator: (r1, r2) => r1.uri < r2.uri
      },
      {
        index: 4,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText
      }
    ],
    tasks: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.1,
        renderCell: renderText
      },
      {
        index: 2,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText
      }
    ],
    scenes: [
      {
        index: 1,
        field: "version",
        headerName: "Version",
        flex: 0.08,
        renderCell: renderText
      },
      {
        index: 2,
        field: "dcc",
        headerName: "DCC",
        flex: 0.1,
        renderCell: renderText
      },
      {
        index: 3,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText
      }
    ]
  };

  const addSpecificColumns = columns => {
    const toAdd = specificColumns[props.resultType];
    if (!toAdd) return columns;
    toAdd.forEach(columnData => {
      columns.splice(columnData.index, 0, columnData);
    });
    return columns;
  };

  const columns = [
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      minWidth: props.tileSize * 16,
      maxWidth: props.tileSize * 16,
      renderCell: renderEntity,
      sortComparator: (r1, r2) => r1.name < r2.name,
      cellClassName: () => "thumbnailColumn"
    },
    {
      field: "modificationTime",
      headerName: "Modified",
      flex: 0.11,
      renderCell: renderText
    },
    // {field: "creationTime", headerName: "Created", flex: 0.1}
  ];

  const getRows = () => {
    return (
      props.data.map((entity, index) => {
        return {
          id: index,
          thumbnail: entity,
          name: entity.name,
          dir_kind: entity.dir_kind,
          dcc: entity.dcc,
          version: entity.version,
          uri: entity.uri,
          context: entity.context,
          creationTime: entity.creation_time,
          modificationTime: entity.modification_time
        };
      })
    );
  };

  const handleRowClick = (params, e) => {
    if (e.detail === 2) {
      var path = params.row.thumbnail.path;
      if (params.row.thumbnail.task) {
        path = params.row.thumbnail.task.path;
      }
      setCurrentContext(path);
    }
    props.onSelected(params.row.thumbnail);
  };

  const handleRowContextMenu = e => {
    // Bit ugly but upon right click on any point on a row, it finds the
    // thumbnail element and triggers onContextMenu()
    e.preventDefault();
    const row = e.target.dataset.field ?
      e.target.parentElement : e.target.parentElement.parentElement;
    const tile = row.firstChild.firstChild;
    for (const key in tile) {
      if (key.startsWith("__reactProps$")) {
        if (tile[key].onContextMenu) tile[key].onContextMenu(e);
      }
    }
  };

  return (
    <div style={{height: "100%"}} onContextMenu={props.onContextMenu}>
      <DataGrid
        onRowClick={handleRowClick}
        componentsProps={{
          row: {
            onContextMenu: handleRowContextMenu
          },
        }}
        page={props.page - 1}
        pageSize={props.pageSize}
        rows={getRows()}
        sx={{
          border: "none",
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            marginTop: "1px!important"
          },
          "& .MuiDataGrid-row": {
            boxSizing: "border-box",
            cursor: "pointer"
          },
          "& .MuiDataGrid-row.Mui-selected": {
            outline: "1px solid rgb(252, 140, 3)",
            background: "rgb(40, 40, 40)"
          },
          // "& .MuiDataGrid-cell": {
          //   borderLeft: "1px solid rgb(30, 30, 30)"
          // },
          "& .MuiDataGrid-cell:focus": {
            outline: "none"
          },
          "& .thumbnailColumn": {
            padding: "1px 0px"
          }
        }}
        rowHeight={props.tileSize * 9}
        // getRowHeight={() => "auto"}
        headerHeight={0}
        hideFooter
        selectionModel={selectionModel}
        onSelectionModelChange={setSelectionModel}
        columns={addSpecificColumns(columns)}
        // isCellEditable={shouldBeEditable}
        // processRowUpdate={handleEdit}
        // onProcessRowUpdateError={handleError}
        // experimentalFeatures={{ newEditingApi: true }}
        components={{
          NoRowsOverlay: () => <DataPlaceholder text="No data" />
        }}
        options={{
          customHeadRender: () => null
        }}
      />
    </div>
  );
};

export default RowView;

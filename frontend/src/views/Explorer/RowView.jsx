import React, { useState, useMemo } from "react";

import {DataGrid} from "@mui/x-data-grid";

import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "./AssetTile";
import URI from "../../components/URI";
import DirectoryTile from "./DirectoryTile";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import { Typography } from "@mui/material";


const RowView = props => {
  const [contextMenu, setContextMenu] = useState(null);

  const renderEntity = params => {
    switch (props.viewType) {
    default:
      return useMemo(() =>
        <DirectoryTile
          onContextMenu={props.onContextMenu}
          entity={params.value}
          noInfo
          noBorder
        />, [params.value]
      );
    case "assets":
      return useMemo(() =>
        <AssetTile
          onContextMenu={props.onContextMenu}
          entity={params.value}
          noInfo
          noBorder
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
      }
    ],
    assets: [
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
    const toAdd = specificColumns[props.viewType];
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

  const handleRowClick = params => {
    props.onSelected(params.row.thumbnail);
  };

  const handleRowContextMenu = e => {
    e.preventDefault();
    const row = e.target.dataset.field ? e.target.parentElement : e.target.parentElement.parentElement;
    const tile = row.firstChild.firstChild;
    for (const key in tile) {
      if (key.startsWith("__reactProps$")) {
        if (tile[key].onContextMenu) tile[key].onContextMenu(e);
      }
    }
  };

  return (
    <div style={{height: "100%"}}>
      {/* <ContextMenu items={props.contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      /> */}
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
          "& .MuiDataGrid-row": {
            boxSizing: "border-box"
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

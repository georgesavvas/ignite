import React, { memo, useMemo } from "react";

import Typography from "@mui/material/Typography";
import {DataGrid, GridActionsCellItem} from "@mui/x-data-grid";

import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "./AssetTile";
import URI from "../../components/URI";
import DirectoryTile from "./DirectoryTile";


const RowView = props => {
  const renderEntity = params => {
    switch (props.viewType) {
    default:
      return useMemo(() =>
        <DirectoryTile entity={params.value} noInfo noBorder />, [params.value]
      );
    case "assets":
      return useMemo(() =>
        <AssetTile entity={params.value} noInfo noBorder />, [params.value]
      );
    }
  };

  const renderUri = ({value}) => {
    return (
      <URI uri={value} />
    );
  };

  const specificColumns = {
    assets: [
      {index: 1, field: "name", headerName: "Name", flex: 0.1},
      {index: 2, field: "version", headerName: "Version", flex: 0.08},
      {
        index: 3, 
        field: "uri", 
        headerName: "URI", 
        flex: 0.4,
        renderCell: renderUri,
        sortComparator: (r1, r2) => r1.uri < r2.uri
      }
    ],
    tasks: [
      {index: 1, field: "name", headerName: "Name", flex: 0.1}
    ],
    scenes: [
      {index: 1, field: "version", headerName: "Version", flex: 0.08},
      {index: 2, field: "dcc", headerName: "DCC", flex: 0.1}
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
    {field: "context", headerName: "Context", flex: 0.2},
    {field: "creationTime", headerName: "Created", flex: 0.1},
    {field: "modificationTime", headerName: "Modified", flex: 0.1}
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

  return (
    <div style={{height: "100%"}}>
      <DataGrid
        onRowClick={handleRowClick}
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
          //   borderLeft: "1px solid rgb(70, 70, 70)"
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

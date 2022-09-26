import React from "react";

import Typography from "@mui/material/Typography";
import {DataGrid, GridActionsCellItem} from "@mui/x-data-grid";

import DataPlaceholder from "../../components/DataPlaceholder";
import AssetTile from "./AssetTile";


const RowView = props => {

  const renderEntity = ({value}) => {
    return (
      <AssetTile entity={value} size={props.tileSize * 10} viewType="row" />
    );
  };

  const columns = [
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      minWidth: props.tileSize * 16,
      renderCell: renderEntity,
      sortComparator: (r1, r2) => r1.name < r2.name,
      // valueGetter: params => params.row.uri,
    },
    {field: "name", headerName: "Name", flex: 0.08},
    {field: "version", headerName: "Version", flex: 0.08},
    {field: "uri", headerName: "URI", flex: 0.4},
    {field: "context", headerName: "Context", flex: 0.2},
    {field: "creationTime", headerName: "Created", flex: 0.1},
    {field: "modificationTime", headerName: "Modified", flex: 0.1},
    {field: "size", headerName: "Size", flex: 0.1}
  ];

  const getRows = () => {
    return (
      props.data.map((entity, index) => {
        return {
          id: index,
          thumbnail: entity,
          name: entity.name,
          version: entity.version,
          uri: entity.uri,
          context: entity.context,
          creationTime: entity.creation_time,
          modificationTime: entity.modification_time,
          size: entity.size
        };
      })
    );
  };

  return (
    <div style={{height: "100%"}}>
      <DataGrid
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
          "& .MuiDataGrid-cell:focus": {
            outline: "none"
          }
        }}
        // rowHeight={props.tileSize * 10}
        getRowHeight={() => "auto"}
        hideFooter
        columns={columns}
        // isCellEditable={shouldBeEditable}
        // processRowUpdate={handleEdit}
        // onProcessRowUpdateError={handleError}
        // experimentalFeatures={{ newEditingApi: true }}
        components={{
          NoRowsOverlay: () => <DataPlaceholder text="No data" />
        }}
      />
    </div>
  );
};

export default RowView;

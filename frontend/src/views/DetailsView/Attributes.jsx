import React, { useState, useEffect, useContext } from "react";
import styles from "./Attributes.module.css";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from "notistack";
import { CopyToClipboard } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import clientRequest from "../../services/clientRequest";
import { DataGrid } from "@mui/x-data-grid";

const columns = [
  { field: "name", headerName: "Name", editable: true, flex: 1 },
  { field: "inherited", headerName: "Inherited", editable: true, flex: 1 },
  { field: "override", headerName: "Override", editable: true, flex: 1, editable: true }
];

const rows = [
  {
    id: 1,
    name: "fstart",
    value: 1001
  },
  {
    id: 2,
    name: "fend",
    value: 1100
  },
  {
    id: 3,
    name: "fps",
    value: 25
  },
  {id: 4}
]

function Attributes(props) {

  let data = props.attribs || [];
  data.push({id: data.length});

  return (
    <div className={styles.container}>
      <Typography variant="h5" style={{marginBottom: "10px"}}>Attributes</Typography>
      <div className={styles.attributeList}>
        <DataGrid
          disableSelectionOnClick
          rows={data}
          columns={columns}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </div>
    </div>
  )
}

export default Attributes;

import React, { useState, useRef, useMemo } from "react";
import styles from "./Attributes.module.css";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from "notistack";
import { CopyToClipboard } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import clientRequest from "../../services/clientRequest";
import { DataGrid } from '@mui/x-data-grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

const columns = [
  { field: "name", headerName: "Name", editable: true, flex: 1 },
  { field: "inherited", headerName: "Inherited", editable: true, flex: 1 },
  { field: "override", headerName: "Override", editable: true, flex: 1 }
];

function useApiRef() {
  const apiRef = useRef(null);
  const _columns = useMemo(
    () =>
      columns.concat({
        field: "__HIDDEN__",
        width: 0,
        renderCell: (params) => {
          apiRef.current = params.api;
          return null;
        }
      }),
    [columns]
  );

  return { apiRef, columns: _columns };
}

function Attributes(props) {

  let data = props.attribs || [];
  data.push({id: data.length});

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>Attributes</Typography>
        <FormControl sx={{ m: 1, minWidth: 120 }}>
          <Select
            value="add"
            onChange={handleAddAttrib}
            inputProps={{ "aria-label": "Without label" }}
            size="small"
          >
            <MenuItem disabled value="add">Add</MenuItem>
            <MenuItem value="fstart">Start Frame</MenuItem>
            <MenuItem value="fend">End Frame</MenuItem>
            <MenuItem value="fps">FPS</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className={styles.attributeList}>
        <DataGrid
          disableSelectionOnClick
          rows={data}
          columns={columns}
          isCellEditable={params => params.row.inherited === ""}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </div>
    </div>
  )
}

export default Attributes;

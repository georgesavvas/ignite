import React, { useState, useRef, useMemo, useEffect } from "react";
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
import { rgbToHex } from "@mui/material";
import serverRequest from "../../services/serverRequest";

const shouldBeEditable = params => {
  const row = params.row;
  if (params.field !== "name" && !row.name) return;
  return true;
}

const getRowStyle = params => {
  if (params.isEditable) return "";
  return "locked";
}

const gridStyles = {
  "& .locked": {
    "&. MuiDataGrid-cellContent": {
      backgroundColor: "red"
    },
    backgroundColor: "rgb(30,30,30)"
  }
}

const columns = [
  { field: "name", headerName: "Name", editable: shouldBeEditable, flex: 1, cellClassName: getRowStyle},
  { field: "inherited", headerName: "Inherited", flex: 1, cellClassName: getRowStyle },
  { field: "override", headerName: "Override", editable: shouldBeEditable, flex: 1, cellClassName: getRowStyle }
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
  const { apiRef, columns } = useApiRef();
  const [data, setData] = useState([]);

  useEffect(() => {
    let attribs = props.attributes || [];
    attribs.forEach((attrib, index) => attrib.id = index);
    setData(attribs || []);
  }, [props.attributes]);

  const handleAddAttrib = e => {
    let value = e.target.value;
    if (value === "custom") value = "";
    setData(prevState => {
      let attribs = [...prevState];
      attribs.push({id: attribs.length, name: value});
      return attribs;
    });
  }

  const handleEdit = (newValues, previousValues) => {
    if (newValues === previousValues) return newValues;
    let attribs = data;
    attribs.forEach(attrib => {
      if (attrib.id === newValues.id) {
        attrib.name = newValues.name;
        attrib.override = newValues.override;
      }
    })
    console.log("Sending:", attribs);
    serverRequest(
      "set_attributes",
      {path: props.entityPath, attributes: attribs}).then(resp => {
        console.log(resp);
      }
    )
    return newValues;
  }

  const handleError = error => {
    console.log(error);
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Typography variant="h5" style={{ marginBottom: "10px" }}>Attributes</Typography>
        <FormControl>
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
          sx={gridStyles}
          disableSelectionOnClick
          rows={data}
          columns={columns.slice(0, -1)}
          isCellEditable={params => !params.row.inherited || params.row.inherited === ""}
          processRowUpdate={handleEdit}
          onProcessRowUpdateError={handleError}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </div>
    </div>
  )
}

export default Attributes;

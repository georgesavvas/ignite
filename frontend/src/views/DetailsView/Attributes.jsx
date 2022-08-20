import React, { useState, useRef, useMemo, useEffect } from "react";
import styles from "./Attributes.module.css";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from "notistack";
import { CopyToClipboard } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import clientRequest from "../../services/clientRequest";
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { rgbToHex } from "@mui/material";
import serverRequest from "../../services/serverRequest";
import DeleteIcon from '@mui/icons-material/DeleteOutlined';

const shouldBeEditable = params => {
  const row = params.row;
  if (params.field !== "name" && !row.name) return;
  if (row.inherited) return;
  console.log(params);
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

function Attributes(props) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let attribs = props.attributes || [];
    attribs.forEach((attrib, index) => attrib.id = index);
    setData(attribs || []);
  }, [props.attributes]);

  useEffect(() => {
    serverRequest("set_attributes", {path: props.entityPath, attributes: data})
  }, [data]);

  const actions = {
    field: "actions",
    type: "actions",
    headerName: "Actions",
    width: 80,
    cellClassName: "actions",
    getActions: params => {
      if (!shouldBeEditable(params)) return [];
      return [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDelete(params.id)}
          color="inherit"
        />,
      ];
    }
  }
  
  const columns = [
    { field: "name", headerName: "Name", flex: 1, editable: true, cellClassName: getRowStyle},
    { field: "inherited", headerName: "Inherited", flex: 1, editable: true, cellClassName: getRowStyle },
    { field: "override", headerName: "Override", flex: 1, editable: true, cellClassName: getRowStyle },
    actions
  ];

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
    setData(attribs);
    return newValues;
  }

  const handleDelete = id => () => {
    setData(prevState => prevState.filter(row => row.id !== id));
  };

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
          columns={columns}
          isCellEditable={shouldBeEditable}
          processRowUpdate={handleEdit}
          onProcessRowUpdateError={handleError}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </div>
    </div>
  )
}

export default Attributes;

import React, { useState, useContext, useEffect } from "react";
import styles from "./Attributes.module.css";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CopyIcon from "../../icons/CopyIcon";
import { useSnackbar } from "notistack";
import { CopyToClipboard } from "../ContextActions";
import {ContextContext} from "../../contexts/ContextContext";
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
import DataPlaceholder from "../../components/DataPlaceholder";

const shouldBeEditable = params => {
  // console.log(params);
  const row = params.row;
  if (params.field !== "name" && !row.name) return;
  if (row.inherited && params.field === "name") return;
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
  },
  // "& .actions": {
  //   backgroundColor: "rgb(30,30,30)"
  // }
}

function Attributes(props) {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [data, setData] = useState({attribs: [], shouldWrite: false});

  useEffect(() => {
    let attribs = props.attributes || [];
    attribs.forEach((attrib, index) => attrib.id = index);
    setData({attribs: attribs || [], shouldWrite: false});
  }, [props.entityPath, props.attributes]);

  useEffect(() => {
    if (!data.shouldWrite) return;
    serverRequest("set_attributes", {path: props.entityPath, attributes: data.attribs})
    refreshContext()
  }, [data]);

  const actions = {
    field: "actions",
    type: "actions",
    headerName: "Actions",
    width: 80,
    cellClassName: "actions",
    getActions: params => {
      return [
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDelete(params.id, params.row)}
          color="inherit"
        />,
      ];
    }
  }
  
  const columns = [
    { field: "name", headerName: "Name", flex: 1, editable: true, cellClassName: getRowStyle},
    { field: "inherited", headerName: "Inherited", flex: 1, editable: false, cellClassName: getRowStyle },
    { field: "override", headerName: "Override", flex: 1, editable: true, cellClassName: getRowStyle },
    actions
  ];

  const handleAddAttrib = e => {
    let value = e.target.value;
    if (value === "custom") value = "";
    setData(prevState => {
      let attribs = [...prevState.attribs];
      attribs.push({id: data.attribs.at(-1).id + 1, name: value});
      return {attribs: attribs, shouldWrite: false};
    });
  }

  const handleEdit = (newValues, previousValues) => {
    console.log(newValues, previousValues, newValues === previousValues)
    if (newValues === previousValues) return newValues;
    let attribs = data.attribs;
    attribs.forEach(attrib => {
      if (attrib.id === newValues.id) {
        attrib.name = newValues.name;
        attrib.override = newValues.override;
      }
    })
    setData({attribs: attribs, shouldWrite: true});
    return newValues;
  }

  const handleDelete = (id, row) => () => {
    if (row.inherited) {
      setData(prevState => ({
        attribs: prevState.attribs.map(row => {
          if (row.id === id) row.override = "";
          return row;
        }),
        shouldWrite: true
      }));
    } else {
      setData(prevState => ({
        attribs: prevState.attribs.filter(row => row.id !== id),
        shouldWrite: true
      }));
    }
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
          rows={data.attribs}
          columns={columns}
          isCellEditable={shouldBeEditable}
          processRowUpdate={handleEdit}
          onProcessRowUpdateError={handleError}
          experimentalFeatures={{ newEditingApi: true }}
          components={{
            NoRowsOverlay: () => <DataPlaceholder text="No attributes" />,
          }}
        />
      </div>
    </div>
  )
}

export default Attributes;

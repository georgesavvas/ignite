// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, useContext, useEffect} from "react";

import Typography from "@mui/material/Typography";
import {DataGrid, GridActionsCellItem} from "@mui/x-data-grid";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";

import styles from "./Attributes.module.css";
import DataPlaceholder from "../../components/DataPlaceholder";
import serverRequest from "../../services/serverRequest";
import {ContextContext} from "../../contexts/ContextContext";


const shouldBeEditable = params => {
  // console.log(params);
  const row = params.row;
  if (params.field !== "name" && !row.name) return;
  if (row.inherited && params.field === "name") return;
  return true;
};

const getRowStyle = params => {
  if (params.isEditable) return "";
  return "locked";
};

const gridStyles = {
  "& .locked": {
    backgroundColor: "rgb(81,81,81)"
  },
};

function Attributes(props) {
  const [,, refreshContext] = useContext(ContextContext);
  const [data, setData] = useState({attribs: [], shouldWrite: false});

  useEffect(() => {
    let attribs = props.attributes || [];
    attribs.forEach((attrib, index) => attrib.id = index);
    setData({attribs: attribs || [], shouldWrite: false});
  }, [props.entityPath, props.attributes]);

  useEffect(() => {
    if (!data.shouldWrite) return;
    serverRequest(
      "set_attributes",
      {path: props.entityPath, attributes: data.attribs}
    );
    refreshContext();
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
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDelete(params.id, params.row)}
          color="inherit"
        />,
      ];
    }
  };
  
  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      editable: true,
      cellClassName: getRowStyle
    },
    {
      field: "inherited",
      headerName: "Inherited",
      flex: 1,
      editable: false,
      cellClassName: getRowStyle
    },
    {
      field: "override",
      headerName: "Override",
      flex: 1,
      editable: true,
      cellClassName: getRowStyle
    },
    actions
  ];

  const handleAddAttrib = e => {
    let value = e.target.value;
    if (value === "custom") value = "";
    const lastAttrib = data.attribs.at(-1);
    setData(prevState => {
      let attribs = [...prevState.attribs];
      attribs.push({id: lastAttrib ? lastAttrib.id + 1 : 0, name: value});
      return {attribs: attribs, shouldWrite: false};
    });
  };

  const handleEdit = (newValues, previousValues) => {
    if (newValues === previousValues) return newValues;
    let attribs = data.attribs;
    attribs.forEach(attrib => {
      if (attrib.id === newValues.id) {
        attrib.name = newValues.name;
        attrib.override = newValues.override;
      }
    });
    setData({attribs: attribs, shouldWrite: true});
    return newValues;
  };

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
  };

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
          hideFooter
          rows={data.attribs}
          columns={columns}
          isCellEditable={shouldBeEditable}
          processRowUpdate={handleEdit}
          onProcessRowUpdateError={handleError}
          experimentalFeatures={{ newEditingApi: true }}
          components={{
            NoRowsOverlay: () =>
              <DataPlaceholder
                text="No attributes"
                style={{position: "relative"}}
              />,
          }}
        />
      </div>
    </div>
  );
}

export default Attributes;

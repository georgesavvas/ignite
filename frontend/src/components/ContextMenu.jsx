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


import React from "react";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Typography } from "@mui/material";


const style = {
  display: "flex",
  gap: "5px",
  justifyContent: "center",
  backgroundColor: "rgb(30, 30, 30)",
  padding: "2px 5px",
  marginBottom: "2px"
};

export function handleContextMenu(event, contextMenu, setContextMenu, data) {
  event.preventDefault();
  event.stopPropagation();
  setContextMenu(
    contextMenu === null
      ? {
        mouseX: event.clientX - 2,
        mouseY: event.clientY - 4,
        data: data
      }
      : null,
  );
}

function ContextMenu(props) {
  const handleClose = () => {
    props.setContextMenu(null);
  };

  function formatItem(item, index) {
    if (!item.args) item.args = [];
    return (
      <MenuItem
        key={index}
        onClick={e => {
          e.stopPropagation();
          if (item.fn) item.fn(...item.args);
          handleClose();
        }}
        divider={item.divider || false}
        style={{
          paddingTop: "2px",
          paddingBottom: "2px",
          fontSize: "0.8rem"
        }}
      >
        {item.label}
      </MenuItem>
    );
  }

  return (
    <Menu
      open={props.contextMenu !== null}
      onClose={handleClose}
      MenuListProps={{style: {padding: 0, paddingBottom: "4px"}}}
      anchorReference="anchorPosition"
      anchorPosition={
        props.contextMenu !== null
          ? { top: props.contextMenu.mouseY, left: props.contextMenu.mouseX }
          : undefined
      }
    >
      <div style={style}>
        {props.title ? <Typography>{props.title}</Typography> : null}
        {props.subtitle ? 
          <Typography color="darkgrey">({props.subtitle})</Typography>
          : null
        }
      </div>
      {props.items.map((item, index) => formatItem(item, index))}
    </Menu>
  );
}

export default ContextMenu;

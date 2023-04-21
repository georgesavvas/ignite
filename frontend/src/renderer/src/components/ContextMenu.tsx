// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Typography } from "@mui/material";

const style = {
  display: "flex",
  gap: "5px",
  justifyContent: "center",
  backgroundColor: "rgb(30, 30, 30)",
  padding: "2px 5px",
  marginBottom: "2px",
};

interface ContextMenu {
  mouseX: number;
  mouseY: number;
  data: any;
}

type HandleContextMenuFn = (contextMenu: ContextMenu | null) => void;

export const handleContextMenu = (
  e: React.MouseEvent<HTMLElement>,
  contextMenu: ContextMenu | null,
  setContextMenu: (contextMenu: any) => void,
  data?: any
) => {
  e.preventDefault();
  e.stopPropagation();
  setContextMenu(
    contextMenu === null
      ? {
          mouseX: e.clientX - 2,
          mouseY: e.clientY - 4,
          data: data,
        }
      : null
  );
};

interface ContextMenuProps {
  contextMenu: ContextMenu;
  items: ContextMenuItem[];
  title?: string;
  subtitle?: string;
  setContextMenu: HandleContextMenuFn;
}

interface ContextMenuItem {
  divider?: boolean;
  args?: any[];
  disabled?: boolean;
  fn: Function;
  label: string;
}

export const ContextMenu = (props: ContextMenuProps) => {
  const handleClose = () => {
    props.setContextMenu(null);
  };

  function formatItem(item: ContextMenuItem, index: number) {
    return (
      <MenuItem
        key={index}
        onClick={(e) => {
          e.stopPropagation();
          if (item.fn && item.args?.length) item.fn(...item.args);
          else if (item.fn) item.fn();
          handleClose();
        }}
        divider={item.divider || false}
        disabled={item.disabled}
        style={{
          paddingTop: "2px",
          paddingBottom: "2px",
          fontSize: "0.8rem",
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
      MenuListProps={{ style: { padding: 0, paddingBottom: "4px" } }}
      anchorReference="anchorPosition"
      anchorPosition={
        props.contextMenu !== null
          ? { top: props.contextMenu.mouseY, left: props.contextMenu.mouseX }
          : undefined
      }
    >
      <div style={style}>
        {props.title ? <Typography>{props.title}</Typography> : null}
        {props.subtitle ? <Typography color="darkgrey">({props.subtitle})</Typography> : null}
      </div>
      {props.items.map((item, index) => formatItem(item, index))}
    </Menu>
  );
};

export default ContextMenu;

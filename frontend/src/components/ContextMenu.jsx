import React, {useState} from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export function handleContextMenu(event, contextMenu, setContextMenu) {
  event.preventDefault();
  setContextMenu(
    contextMenu === null
      ? {
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
        }
      : null,
  );
};

function ContextMenu(props) {
  // const [contextMenu, setContextMenu] = useState(null);

  const handleClose = () => {
    props.setContextMenu(null);
  };

  function formatItem(item, index) {
    // if (item.type === "divider") return <Divider />
    if (!item.fn) item.fn = () => {};
    if (!item.args) item.args = [];
    return(
      <MenuItem
        key={index}
        onClick={e => {
          e.stopPropagation();
          item.fn(...item.args);
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
    )
  }

  return (
    <Menu
      open={props.contextMenu !== null}
      onClose={handleClose}
      MenuListProps={{style: {padding: "4px 0"}}}
      anchorReference="anchorPosition"
      anchorPosition={
        props.contextMenu !== null
          ? { top: props.contextMenu.mouseY, left: props.contextMenu.mouseX }
          : undefined
      }
    >
      {props.items.map((item, index) => formatItem(item, index))}
    </Menu>
  )
}

export default ContextMenu;

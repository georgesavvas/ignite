import React, {useState} from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export function handleContextMenu(props) {
  props.event.preventDefault();
  setContextMenu(
    props.contextMenu === null
      ? {
          mouseX: props.event.clientX - 2,
          mouseY: props.event.clientY - 4,
        }
      : null,
  );
};

function ContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const handleClose = () => {
    setContextMenu(null);
  };

  function formatItem(item, index) {
    // if (item.type === "divider") return <Divider />
    return(
      <MenuItem
        key={index}
        data={item}
        onClick={() => item.fn(...item.args)}
        divider={item.divider || false}
      >
        {item.label}
      </MenuItem>
    )
  }

  return (
    <Menu
      open={contextMenu !== null}
      onClose={handleClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
    >
      {props.items.map((item, index) => formatItem(item, index))}
    </Menu>
  )
}

export default ContextMenu;

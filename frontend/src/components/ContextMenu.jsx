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

export default function ContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const handleClose = () => {
    setContextMenu(null);
  };

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
      {dirContextOptions[props.dir_kind].map(contextOption => (
          <MenuItem
            key={contextOption.name}
            value={contextOption.name}
            dir_path={props.dir_path}
            onClick={(() => handleClick(
              props.dir_path,
              contextOption
            ))}
            style={{
              paddingTop: "2px",
              paddingBottom: "2px",
              fontSize: "0.8rem"
            }}
          >
            {contextOption.label}
          </MenuItem>
        ))}
        <Divider />
    </Menu>
  )
}

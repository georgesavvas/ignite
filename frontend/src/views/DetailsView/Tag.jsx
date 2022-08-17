import React, { useState } from 'react'
import styles from "./Tag.module.css";
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { TextField, Typography } from '@mui/material';
import Modal from "../../components/Modal";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
const stc = require("string-to-color");

const namedStyles = {
  locked: {
    backgroundColor: "rgb(40, 40, 100)"
  },
  approved: {
    backgroundColor: "rgb(40,100,40)"
  },
  deprecated: {
    backgroundColor: "rgb(5, 5, 5)"
  }
}

export function TagContainer(props) {
  const [newTagsOpen, setNewTagsOpen] = useState(false);
  const [newTagsName, setNewTagsName] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const contextItems = [
    {
      label: "Copy tag",
      fn: () =>  CopyToClipboard(props.name, enqueueSnackbar)
    },
    {
      label: "Remove tag",
      fn: () => {}
    }
  ]

  const handleAddTagsClicked = e => {
    props.onAdd(newTagsName);
    setNewTagsOpen(false);
  }

  return (
    <>
    <ContextMenu items={contextItems} contextMenu={contextMenu}
      setContextMenu={setContextMenu}
    />
    <Modal open={newTagsOpen} onClose={() => setNewTagsOpen(false)} maxWidth="md"
      closeButton onButtonClicked={handleAddTagsClicked} buttonLabel="Create"
      title="Add Tags" 
    >
      <Typography variant="caption">Multiple tags can be separated by comma</Typography>
      <TextField onChange={e => setNewTagsName(e.target.value)} value={newTagsName} 
        size="small" fullWidth
      />
    </Modal>
    <div className={styles.container}>
      {props.children}
      <EditTag add onClick={() => setNewTagsOpen(true)} />
    </div>
    </>
  )
}

function Tag(props) {
  const [isHovered, setIsHovered] = useState(false);

  let style = {backgroundColor: stc(props.name)};
  if (namedStyles.hasOwnProperty(props.name)) style = namedStyles[props.name];

  return (
    <div className={styles.tag} style={style}
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
    >
      {props.name}
      {isHovered && !props.add ?
        <ClearIcon style={{cursor: "pointer"}} onClick={() => props.onDelete(props.name)} /> :
        null
      }
    </div>
  )
}

function EditTag(props) {
  return (
    <div className={styles.tagEdit} onClick={props.onClick} >
      <AddIcon />
    </div>
  )
}

export default Tag;

import React, { useState } from 'react'
import styles from "./Tag.module.css";
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import { TextField } from '@mui/material';
import Modal from "../../components/Modal";
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
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  return (
    <>
    <Modal open={newTagOpen} onClose={() => setNewTagOpen(false)} maxWidth="xs" closeButton
      title="Add Tag" buttonLabel="Create" onButtonClicked={props.onAdd(newTagName)}>
      <TextField onChange={e => setNewTagName(e.target.value)} size="small" label="Tag" />
    </Modal>
    <div className={styles.container}>
      {props.children}
      <Tag name="Add Tag" />
      <EditTag add onClick={() => setNewTagOpen(true)} />
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
        <ClearIcon style={{cursor: "pointer"}} onClick={props.onDelete} /> :
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

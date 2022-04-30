import React from 'react';
import styles from "./DynamicList.module.css";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Add from '@mui/icons-material/Add';

const style = {
  width: "100%",
  // height: "100%",
  backgroundColor: "rgb(30,30,30)",
  overflowY: "scroll",
  flexGrow: 1
}

function createListItem(child, index, dense) {
  return (
    <ListItem key={index} dense={dense}>
      {child}
    </ListItem>
  )
}

function buttons(props) {
  return (
    <div className={styles.buttonContainer}>
      <AddIcon className={styles.button} onClick={props.onAdd || null}/>
      <RemoveIcon className={styles.button} onClick={props.onRemove || null}/>
    </div>
  )
}

function DynamicList(props) {
  return (
    <>
      {props.noButtons ? null : buttons(props)}
      <List sx={style}>
        {
          props.children ?
          props.children.map((child, index) => createListItem(child, index, props.dense)) :
          null
        }
      </List>
    </>
  )
}

export default DynamicList;

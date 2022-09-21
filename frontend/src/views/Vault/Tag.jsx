import { Chip } from '@mui/material';
import React from 'react'
import styles from "./Tag.module.css";
import { hexToHsl } from '../../utils/hexToHsl';
const stc = require('string-to-color');

export function TagContainer(props) {
  return (
    <div className={styles.container}>
      {props.children}
    </div>
  )
}

function Tag(props) {
  return (
    // <div className={styles.tag} style={{backgroundColor: stc(props.name)}}>{props.name}</div>
    <Chip label={props.name} sx={{backgroundColor: hexToHsl(stc(props.name), 80, 30)}} />
  )
}

export default Tag;

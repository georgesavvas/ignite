import React from "react";

import Chip from "@mui/material/Chip";
import stc from "string-to-color";

import {hexToHsl} from "../../utils/hexToHsl";
import styles from "./Tag.module.css";


export function TagContainer(props) {
  return (
    <div className={styles.container}>
      {props.children}
    </div>
  );
}

function Tag(props) {
  return (
    <Chip label={props.name} sx={{backgroundColor: hexToHsl(stc(props.name), 80, 30)}} />
  );
}

export default Tag;

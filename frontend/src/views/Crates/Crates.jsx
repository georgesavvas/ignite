import { Typography } from "@mui/material";
import React from "react";
import styles from "./Crates.module.css";

const Crate = () => {
  return (
    <div className={styles.crate}>

    </div>
  );
};

const Crates = () => {
  return (
    <div className={styles.container}>
      <Crate />
      <Crate />
      {/* <Crate />
      <Crate />
      <Crate /> */}
    </div>
  );
};

export default Crates;

import React, {useState, useContext} from "react";
import Crates from "./Crates";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import styles from "./CratesDropdown.module.css";
import {CrateContext} from "../../contexts/CrateContext";

const CratesDropdown = () => {
  const {floating} = useContext(CrateContext);
  const [pinned, setPinned] = useState(false);
  const [peek, setPeek] = useState(false);

  const getContainerStyle = () => {
    if (pinned) return {transform: "translateY(0%)"};
    if (peek) return {transform: "translateY(-100%) translateY(20px)"};
    if (floating.length) return {transform: "translateY(0%)"};
    return {};
  };

  return (
    <div className={styles.container} style={getContainerStyle()}>
      <div className={styles.content}>
        <Crates />
      </div>
      <div className={styles.dropdown}>
        <img
          src="media/crate.png"
          alt="crate_icon"
          className={styles.crateIcon}
        />
        <ExpandMoreIcon className={styles.arrowIcon} />
      </div>
    </div>
  );
};

export default CratesDropdown;

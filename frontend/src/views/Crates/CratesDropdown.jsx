import React, {useState} from "react";
import Crates from "./Crates";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import styles from "./CratesDropdown.module.css";

const CratesDropdown = () => {
  const [pinned, setPinned] = useState(false);

  return (
    <div className={styles.container} style={pinned ? {transform: "translateY(0%)"} : {}}>
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

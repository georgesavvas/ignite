// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, useContext} from "react";
import Crates from "./Crates";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import styles from "./CratesDropdown.module.css";
import {CrateContext} from "../../contexts/CrateContext";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import clientRequest from "../../services/clientRequest";

const CratesDropdown = () => {
  const {
    floating,
    emptyCrate,
    removeCrate,
    forceOpen
  } = useContext(CrateContext);
  const [pinned] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  const getContainerStyle = () => {
    if (pinned) return {transform: "translateY(0%)"};
    if (contextMenu !== null) return {transform: "translateY(0%)"};
    if (forceOpen) return {transform: "translateY(0%)"};
    if (floating.length) return {transform: "translateY(0%)"};
    return {};
  };

  const handleMakeZip = async crate => {
    const resp = await window.api.dirInput();
    if (resp.cancelled) return;
    const filename = crate.label ?
      crate.label.replaceAll(" ", "_").toLowerCase() :
      crate.id;
    const dest = `${resp.filePaths[0]}/${filename}`;
    const sessionID = await window.services.get_env("IGNITE_SESSION_ID");
    clientRequest(
      "zip_crate",
      {id: crate.id, dest: dest, session_id: sessionID}
    );
  };

  const handleRemoveCrate = crateID => {
    removeCrate(crateID);
  };

  const handleEmptyCrate = crateID => {
    emptyCrate(crateID);
  };

  const contextItems = [
    {
      label: "Delete",
      fn: () => handleRemoveCrate(contextMenu?.data.id)
    },
    {
      label: "Empty",
      fn: () => handleEmptyCrate(contextMenu?.data.id),
    },
    {
      label: "Make zip",
      fn: () => handleMakeZip(contextMenu?.data)
    },
  ];

  const handleContextMenu_ = (e, crate) => {
    handleContextMenu(e, contextMenu, setContextMenu, crate);
  };

  return (
    <div className={styles.container} style={getContainerStyle()}>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu} title={contextMenu?.data.label}
        subtitle="crate"
      />
      <div className={styles.content}>
        <Crates handleContextMenu={handleContextMenu_} />
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

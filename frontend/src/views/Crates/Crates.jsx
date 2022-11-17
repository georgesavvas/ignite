import { OutlinedInput, Typography } from "@mui/material";
import React, {useState, useContext} from "react";
import styles from "./Crates.module.css";
import {CrateContext} from "../../contexts/CrateContext";
import AddIcon from "@mui/icons-material/Add";
import { useEffect } from "react";
import IgnButton from "../../components/IgnButton";
import ClearIcon from "@mui/icons-material/Clear";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssetTile from "../Explorer/AssetTile";
import URI from "../../components/URI";
import DirectoryTile from "../Explorer/DirectoryTile";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import clientRequest from "../../services/clientRequest";

const Crate = props => {
  const [contextMenu, setContextMenu] = useState(null);
  const {
    floating,
    dropFloating,
    removeCrate,
    addCrate,
    emptyCrate
  } = useContext(CrateContext);
  const [crate, setCrate] = useState(
    {id: props.id, entities: props.entities, label: `Crate ${props.index + 1}`}
  );

  const handleLabelChange = e => {
    setCrate(prev => ({...prev, label: e.target.value}));
  };

  const handleDrop = () => {
    dropFloating(crate.id);
  };

  const handleRemoveCrate = () => {
    removeCrate(crate.id);
  };

  const handleEmptyCrate = () => {
    emptyCrate(crate.id);
  };

  const getEntityCrate = entity => {
    return (
      ("asset", "assetversion").includes(entity.dir_kind) ?
        <AssetTile key={entity.uri} entity={entity} noOverlay noInfo noBorder />
        : <DirectoryTile key={entity.uri} entity={entity} noOverlay noInfo noBorder />
    );
  };

  const handleNewCrateClick = () => {
    if (floating.length) dropFloating("");
    else addCrate();
  };

  const handleMakeZip = async () => {
    const resp = await window.api.dirInput();
    if (resp.cancelled) return;
    const dest = resp.filePaths[0];
    const sessionID = await window.services.get_env("IGNITE_SESSION_ID");
    clientRequest(
      "zip_crate",
      {data: {id: crate.id, dest: dest, session_id: sessionID}}
    );
  };

  if (props.index < 0) return (
    <div className={styles.newCrate} onClick={handleNewCrateClick}>
      <AddIcon style={{fontSize: "48px", color: "rgb(252, 140, 3)"}} />
    </div>
  );

  const contextItems = [
    {
      label: "Delete",
      fn: handleRemoveCrate
    },
    {
      label: "Empty",
      fn: handleEmptyCrate,
    },
    {
      label: "Make zip",
      fn: handleMakeZip
    },
  ];

  return (
    <div className={styles.crate}
      onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
    >
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu} title={crate.label} subtitle="crate"
      />
      {floating.length ?
        <div className={styles.overlay}>
          <IgnButton color="ignite" onClick={handleDrop}>Drop in {crate.label}</IgnButton>
        </div>
        : null
      }
      <div className={styles.row}>
        <OutlinedInput size="small" fullWidth placeholder="Crate Label"
          value={crate.label} onChange={handleLabelChange}
        />
        <MoreVertIcon className={styles.menuButton}
          onClick={e => handleContextMenu(e, contextMenu, setContextMenu)}
        />
      </div>
      <div className={styles.tileContainer}>
        {crate.entities.map(entity => getEntityCrate(entity))}
      </div>
    </div>
  );
};

const Crates = () => {
  const {crates} = useContext(CrateContext);

  return (
    <div className={styles.container}>
      {crates.map((crate, index) =>
        <Crate key={crate.id} index={index} id={crate.id}
          entities={crate.entities}
        />
      )}
      <Crate index={-1} key="new" />
    </div>
  );
};

export default Crates;

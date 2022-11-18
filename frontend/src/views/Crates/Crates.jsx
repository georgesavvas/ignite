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

const Crate = props => {
  const {
    floating,
    dropFloating,
    addCrate,
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

  const getEntityCrate = entity => {
    return (
      ("asset", "assetversion").includes(entity.dir_kind) ?
        <AssetTile key={entity.uri} entity={entity} noOverlay noInfo />
        : <DirectoryTile key={entity.uri} entity={entity} noOverlay noInfo />
    );
  };

  const handleNewCrateClick = () => {
    if (floating.length) dropFloating("");
    else addCrate();
  };

  if (props.index < 0) return (
    <div className={styles.newCrate} onClick={handleNewCrateClick}>
      <AddIcon style={{fontSize: "48px", color: "rgb(252, 140, 3)"}} />
    </div>
  );

  return (
    <div className={styles.crate}
      onContextMenu={e => props.handleContextMenu(e, crate)}
    >
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
          onClick={e => props.handleContextMenu(e, crate)}
        />
      </div>
      <div className={styles.tileContainer}>
        {crate.entities.map(entity => getEntityCrate(entity))}
      </div>
    </div>
  );
};

const Crates = props => {
  const {crates} = useContext(CrateContext);

  return (
    <div className={styles.container}>
      {crates.map((crate, index) =>
        <Crate key={crate.id} index={index} id={crate.id}
          entities={crate.entities} handleContextMenu={props.handleContextMenu}
        />
      )}
      <Crate index={-1} key="new" />
    </div>
  );
};

export default Crates;

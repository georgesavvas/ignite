import { OutlinedInput, Typography } from "@mui/material";
import React, {useState, useContext} from "react";
import styles from "./Crates.module.css";
import {CrateContext} from "../../contexts/CrateContext";
import AddIcon from "@mui/icons-material/Add";
import { useEffect } from "react";
import IgnButton from "../../components/IgnButton";
import ClearIcon from "@mui/icons-material/Clear";

const Crate = props => {
  const {floating, dropFloating, removeCrate} = useContext(CrateContext);
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

  const getEntityCrate = entity => {
    return (
      <div>
        <Typography variant="subtitle2">{entity.path}</Typography>
      </div>
    );
  };

  if (props.index < 0) return (
    <div className={styles.newCrate} onClick={props.onClick}>
      <AddIcon style={{fontSize: "48px", color: "rgb(252, 140, 3)"}} />
    </div>
  );

  return (
    <div className={styles.crate}>
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
        <ClearIcon className={styles.removeButton}
          onClick={handleRemoveCrate}
        />
      </div>
      {crate.entities.map(entity => getEntityCrate(entity))}
    </div>
  );
};

const Crates = () => {
  const {crates, addCrate} = useContext(CrateContext);

  const handleAddCrate = () => {
    addCrate();
  };

  return (
    <div className={styles.container}>
      {crates.map((crate, index) =>
        <Crate key={crate.id} index={index} entities={crate.entities} />)
      }
      <Crate index={-1} onClick={handleAddCrate} />
    </div>
  );
};

export default Crates;

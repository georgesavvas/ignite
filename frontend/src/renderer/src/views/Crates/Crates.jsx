// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import {OutlinedInput} from "@mui/material";
import React, {useState, useContext, useEffect} from "react";
import styles from "./Crates.module.css";
import {CrateContext} from "../../contexts/CrateContext";
import AddIcon from "@mui/icons-material/Add";
import IgnButton from "../../components/IgnButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AssetTile from "../Explorer/AssetTile";
import DirectoryTile from "../Explorer/DirectoryTile";
import Component from "../DetailsView/Component";

const Crate = props => {
  const crateFromProps = () => {
    return {
      id: props.id, entities: props.entities, label: `Crate ${props.index + 1}`
    };
  };
  const {floating, dropFloating, addCrate} = useContext(CrateContext);
  const [crate, setCrate] = useState(crateFromProps());

  useEffect(() => {
    setCrate(crateFromProps());
  }, [props]);

  const handleLabelChange = e => {
    setCrate(prev => ({...prev, label: e.target.value}));
  };

  const handleDrop = () => {
    dropFloating(crate.id);
  };

  const getEntityCrate = entity => {
    console.log(entity.uri);
    if (("asset", "assetversion").includes(entity.dir_kind)) {
      return <AssetTile key={entity.uri} entity={entity} noOverlay noInfo />;
    }
    else if (entity.dir_kind === "component") {
      return <Component key={entity.uri} entity={entity} noOverlay noInfo />;
    }
    return <DirectoryTile key={entity.uri} entity={entity} noOverlay noInfo />;
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
        {crate.entities?.map(entity => getEntityCrate(entity))}
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

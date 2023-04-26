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

import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { OutlinedInput } from "@mui/material";
import { CrateType, Entity, InputChangeEvent } from "@renderer/types/common";
import { useContext, useEffect, useState } from "react";

import IgnButton from "../../components/IgnButton";
import { CrateContext, CrateContextType } from "../../contexts/CrateContext";
import Component from "../DetailsView/Component";
import AssetTile from "../Explorer/AssetTile";
import DirectoryTile from "../Explorer/DirectoryTile";
import styles from "./Crates.module.css";

interface CrateProps {
  id?: string;
  index: number;
  entities?: Entity[];
  handleContextMenu?: (e: React.MouseEvent<HTMLElement>, crate: CrateType) => void;
}

const Crate = (props: CrateProps) => {
  const crateFromProps: () => CrateType = () => {
    return {
      id: props.id,
      entities: props.entities,
      label: `Crate ${props.index + 1}`,
    };
  };
  const { floating, dropFloating, addCrate } = useContext(CrateContext) as CrateContextType;
  const [crate, setCrate] = useState<CrateType>(crateFromProps());

  useEffect(() => {
    setCrate(crateFromProps());
  }, [props]);

  const handleLabelChange = (e: InputChangeEvent) => {
    setCrate((prev) => ({ ...prev, label: e.target.value }));
  };

  const handleDrop = () => {
    if (!crate.id) return;
    dropFloating(crate.id);
  };

  const getEntityCrate = (entity: Entity) => {
    console.log(entity.uri);
    if (["asset", "assetversion"].includes(entity.dir_kind)) {
      return <AssetTile key={entity.uri} entity={entity} noOverlay noInfo />;
    } else if (entity.dir_kind === "component") {
      return <Component key={entity.uri} entity={entity} noOverlay noInfo />;
    }
    return <DirectoryTile key={entity.uri} entity={entity} noOverlay noInfo />;
  };

  const handleNewCrateClick = () => {
    if (floating.length) dropFloating("");
    else addCrate();
  };

  if (props.index < 0)
    return (
      <div className={styles.newCrate} onClick={handleNewCrateClick}>
        <AddIcon style={{ fontSize: "48px", color: "rgb(252, 140, 3)" }} />
      </div>
    );

  const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (!props.handleContextMenu) return;
    props.handleContextMenu(e, crate);
  };

  return (
    <div className={styles.crate} onContextMenu={handleContextMenu}>
      {floating.length ? (
        <div className={styles.overlay}>
          <IgnButton color="ignite" onClick={handleDrop}>
            Drop in {crate.label}
          </IgnButton>
        </div>
      ) : null}
      <div className={styles.row}>
        <OutlinedInput
          size="small"
          fullWidth
          placeholder="Crate Label"
          value={crate.label}
          onChange={handleLabelChange}
        />
        <MoreVertIcon className={styles.menuButton} onClick={handleContextMenu} />
      </div>
      <div className={styles.tileContainer}>
        {crate.entities?.map((entity) => getEntityCrate(entity))}
      </div>
    </div>
  );
};

interface CratesProps {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>, crate: CrateType) => void;
}

const Crates = (props: CratesProps) => {
  const { crates } = useContext(CrateContext) as CrateContextType;

  return (
    <div className={styles.container}>
      {crates.map((crate, index) => (
        <Crate
          key={crate.id}
          index={index}
          id={crate.id}
          entities={crate.entities}
          handleContextMenu={props.handleContextMenu}
        />
      ))}
      <Crate index={-1} key="new" />
    </div>
  );
};

export default Crates;

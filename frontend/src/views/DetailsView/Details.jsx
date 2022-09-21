import React, { useContext, useState, useEffect } from "react";
import {EntityContext} from "../../contexts/EntityContext";
import DirectoryDetails from "./DirectoryDetails";
import AssetDetails from "./AssetDetails";
import SceneDetails from "./SceneDetails";
import DataPlaceholder from "../../components/DataPlaceholder";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
}

function Details() {
  const [entityType, setEntityType] = useState("");
  const [selectedEntity, setSelectedEntity] = useContext(EntityContext);

  useEffect(() => {
    setEntityType(selectedEntity.dir_kind);
  }, [selectedEntity])

  function render() {
    switch (selectedEntity.dir_kind) {
      case "assetversion":
        return <AssetDetails entity={selectedEntity} />;
      case "scene":
        return <SceneDetails entity={selectedEntity} />;
      case undefined:
        return <DataPlaceholder text="Nothing selected" />;
      default:
        return <DirectoryDetails entity={selectedEntity} />;
    }
  }

  return (
    <div style={style}>
      {render()}
    </div>
  )
}

export default Details;

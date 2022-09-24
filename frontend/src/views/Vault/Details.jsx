import React, { useContext, useState, useEffect } from "react";
import AssetDetails from "./AssetDetails";
import DataPlaceholder from "../../components/DataPlaceholder";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
}

function Details(props) {
  const [entityType, setEntityType] = useState("");

  const selectedEntity = props.selectedEntity;

  useEffect(() => {
    setEntityType(selectedEntity.dir_kind);
  }, [selectedEntity])

  return (
    <div style={style}>
      {
        selectedEntity && Object.keys(selectedEntity).length ?
        <AssetDetails entity={selectedEntity} /> :
        <DataPlaceholder text="Nothing selected" />
      }
    </div>
  )
}

export default Details;

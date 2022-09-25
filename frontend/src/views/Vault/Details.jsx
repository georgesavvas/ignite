import React from "react";

import AssetDetails from "./AssetDetails";
import DataPlaceholder from "../../components/DataPlaceholder";


const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
};

function Details(props) {
  const selectedEntity = props.selectedEntity;

  return (
    <div style={style}>
      {
        selectedEntity && Object.keys(selectedEntity).length ?
          <AssetDetails entity={selectedEntity} onRefresh={props.onRefresh} /> :
          <DataPlaceholder text="Nothing selected" />
      }
    </div>
  );
}

export default Details;

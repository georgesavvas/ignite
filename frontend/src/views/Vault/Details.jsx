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
  const entity = props.entity;

  return (
    <div style={style}>
      {
        entity && Object.keys(entity).length ?
          <AssetDetails {...props} /> :
          <DataPlaceholder text="Nothing selected" />
      }
    </div>
  );
}

export default Details;

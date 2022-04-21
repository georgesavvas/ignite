import React from "react";
import Tile from "../../components/Tile";
import Typography from '@mui/material/Typography';

function AssetTile(props) {

  function details() {
    if (props.viewType === "grid") return(
      <>
        <Typography style={{position: "absolute", top: "5px", left: "10px"}}>
          {props.entity.context}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", left: "10px"}}>
          {props.entity.name}
        </Typography>
        <Typography style={{position: "absolute", bottom: "5px", right: "10px"}}>
          {props.entity.version}
        </Typography>
      </>
    ); else return(
      <>
        <Typography align="left">{props.entity.name}</Typography>
        <Typography align="left">{props.entity.version}</Typography>
        <Typography align="left">{props.entity.context}</Typography>
      </>
    )
  }

  return (
    <Tile {...props}>
      {details()}
    </Tile>
  );
}

export default AssetTile;

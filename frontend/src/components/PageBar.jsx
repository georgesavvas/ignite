import React from "react";
import Container from '@mui/material/Container';
import Pagination from '@mui/material/Pagination';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import IgnTextField from "./IgnTextField";

const style = {
  margin: "0px",
  padding: "5px",
  paddingLeft: "5px",
  paddingRight: "15px",
  maxHeight: "60px",
  maxWidth: "100%",
  width: "100%",
  display: "flex",
  flex: "1",
  justifyContent: "space-between",
  alignItems: "center"
}

function PageBar(props) {
  return (
    <Container style={style}>
      <div style={{width: "200px", display: "flex", justifyContent: "flex-start"}}>
        <IgnTextField id="tilesPerPage" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, style: { textAlign: 'center' }}} defaultValue={50} style={{width: 55}} variant="outlined" onChange={props.onTilesPerPageChange} />
      </div>
      <Pagination onChange={props.onChange} count={props.pages} variant="outlined" shape="rounded" />
      <div style={{width: "200px", height: "30px"}}>
        <Slider size="small" value={props.tileSize} step={1} marks min={3} max={10} onChange={props.onTileSizeChange} />
      </div>
    </Container>
  )
}

export default PageBar;

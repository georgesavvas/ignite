import React from "react";
import Container from '@mui/material/Container';
import Pagination from '@mui/material/Pagination';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

const style = {
  margin: "0px",
  padding: "10px",
  paddingLeft: "20px",
  paddingRight: "20px",
  maxHeight: "60px",
  width: "100%",
  display: "flex",
  flex: "1",
  justifyContent: "space-between",
  alignItems: "center",
  border: "solid 1px white"
}

function PageBar(props) {
  return (
    <Container style={style}>
      <div style={{width: "200px", display: "flex", justifyContent: "flex-start"}}>
        <TextField id="tilesPerPage" size="small" inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0, style: { textAlign: 'center' }}} defaultValue={50} style={{width: 55}} variant="outlined" onChange={props.onTilesPerPageChange} />
      </div>
      <Pagination onChange={props.onChange} count={props.pages} variant="outlined" shape="rounded" />
      <div style={{width: "200px", height: "30px"}}>
        <Slider size="small" defaultValue={5} step={1} marks min={3} max={10} onChange={props.onTileSizeChange} />
      </div>
    </Container>
  )
}

export default PageBar;

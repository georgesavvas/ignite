import React, { useState, useRef } from "react";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TagContainer from "./TagContainer";
import { OutlinedInput, TextField } from "@mui/material";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import Attributes from "./Attributes";
import URI from "../../components/URI";
import Path from "../../components/Path";

const style = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column"
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "5px"
}

function DirectoryDetails(props) {
  const [reprValue, setReprValue] = useState("");
  const [reptEdit, setReptEdit] = useState(false);
  const dir_kind = props.entity.dir_kind;
  const dir_kind_formatted = dir_kind.charAt(0).toUpperCase() + dir_kind.slice(1)

  const handleReptChange = () => {
    const data = {
      target: props.entity.path,
      repr: reprValue
    }
    serverRequest("set_repr_asset", data)
    setReprValue("");
    setReptEdit(false);
  }

  return (
    <div style={style}>
      <div style={{margin: "10px", overflow: "hidden"}}>
        <Typography variant="h5" style={{marginBottom: "10px"}}>{props.entity.name}</Typography>
        <Path path={props.entity.path} />
        <div style={rowStyle}>
          <Typography style={{minWidth: "110px"}}>Thumbnail from:</Typography>
          {reptEdit || !props.entity.repr ?
            <TextField
              size="small"
              label="Set Representative Asset"
              placeholder="Path or URI"
              fullWidth
              autoFocus
              value={reprValue}
              onChange={e => setReprValue(e.target.value)}
              onBlur={handleReptChange}
            /> :
            <>
              <URI uri={props.entity.repr} />
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setReprValue(props.entity.repr || "")
                  setReptEdit(true)
                }}
                color="ignite"
              >
                Edit
              </Button>
            </>
          }
        </div>
      </div>
      <TagContainer entityPath={props.entity.path} tags={props.entity.tags} />
      <Attributes entityPath={props.entity.path} attributes={props.entity.attributes} />
    </div>
  )
}

export default DirectoryDetails;

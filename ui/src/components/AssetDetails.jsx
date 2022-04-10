import React from "react";
import Typography from '@mui/material/Typography';
import ImageViewer from "./ImageViewer";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const style = {
  width: "100%",
  height: "100%"
}

function AssetDetails(props) {
  return (
    <div style={style}>
      <ReflexContainer orientation="horizontal">
          <ReflexElement flex={0.4}>
            <ImageViewer entity={props.entity} />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.6}>
          <div style={{margin: "10px", overflow: "hidden"}}>
            <Typography variant="h5">Asset Details</Typography>
            <Typography>{props.entity.dir_kind}</Typography>
            <Typography>{props.entity.name}</Typography>
            <Typography>{props.entity.path}</Typography>
            <Typography>{props.entity.context}</Typography>
          </div>
          </ReflexElement>
        </ReflexContainer>
    </div>
  )
}

export default AssetDetails;

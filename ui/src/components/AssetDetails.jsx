import React, {useState} from "react";
import Typography from '@mui/material/Typography';
import ImageViewer from "./ImageViewer";
import ComponentViewer from "./ComponentViewer";
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
  const [selectedCompName, setSelectedCompName] = useState("");

  const getComp = compName => {
    for(const comp of props.entity.components) {
      if (comp.name === compName) return comp;
    }
    return {};
  }

  const selectedComp = getComp(selectedCompName);

  return (
    <div style={style}>
      <ReflexContainer orientation="horizontal">
          <ReflexElement flex={0.4}>
            <ImageViewer entity={selectedComp} />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.2}>
            <div style={{margin: "10px", overflow: "hidden"}}>
              <Typography variant="h5">Asset Details</Typography>
              <Typography>Name: {props.entity.name}</Typography>
              <Typography>Path: {props.entity.path}</Typography>
              <Typography>Context: {props.entity.context}</Typography>
            </div>
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.4}>
            <ComponentViewer components={props.entity.components} selectedComp={selectedComp} onSelect={setSelectedCompName} />
          </ReflexElement>
        </ReflexContainer>
    </div>
  )
}

export default AssetDetails;

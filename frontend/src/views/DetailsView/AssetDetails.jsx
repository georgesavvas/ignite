import React, {useState} from "react";
import Typography from '@mui/material/Typography';
import ComponentViewer from "./ComponentViewer";
import ComponentList from "./ComponentList";
import Tag, { TagContainer } from "./Tag";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import URI from "../../components/URI";

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
      if (comp.filename === compName) return comp;
    }
    return {};
  }

  const selectedComp = getComp(selectedCompName);

  return (
    <div style={style}>
      <ReflexContainer orientation="horizontal">
          <ReflexElement flex={0.4}>
            <ComponentViewer comp={selectedComp} />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.2}>
            <div style={{margin: "10px", overflow: "hidden"}}>
              <Typography variant="h5">Asset Details</Typography>
              <Typography>Name: {props.entity.name}</Typography>
              <Typography>Path: {props.entity.path}</Typography>
              <Typography>Context: {props.entity.context}</Typography>
              <URI uri={props.entity.uri} />
              {/* <Typography color="rgb(252, 140, 3)">URI: {props.entity.uri}</Typography> */}
            </div>
            <TagContainer>
              {props.entity.labels.map((tag, index) => <Tag name={tag} key={index} />)}
            </TagContainer>
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={0.4}>
            <ComponentList components={props.entity.components} selectedComp={selectedComp} onSelect={setSelectedCompName} />
          </ReflexElement>
        </ReflexContainer>
    </div>
  )
}

export default AssetDetails;
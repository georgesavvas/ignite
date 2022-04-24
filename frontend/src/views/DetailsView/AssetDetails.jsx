import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import ComponentViewer from "./ComponentViewer";
import ComponentList from "./ComponentList";
import Tag, { TagContainer } from "./Tag";
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
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

const defaultFlexRations = {
  "asset.viewer": 0.4,
  "asset.details": 0.2,
  "asset.comps": 0.4
}

function AssetDetails(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [selectedCompName, setSelectedCompName] = useState("");

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const viewer = data["asset.viewer"];
    const details = data["asset.details"];
    const comps = data["asset.comps"];
    if (!viewer || !details || !comps) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const fullWidth = viewer[1] + details[1] + comps[1];
    const ratios = {
      "asset.viewer": viewer[1] / fullWidth,
      "asset.details": details[1] / fullWidth,
      "asset.comps": comps[1] / fullWidth
    };
    setFlexRatios(ratios);
  }, [])

  const handleResized = data => {
    saveReflexLayout(data)
  }

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
          <ReflexElement flex={flexRatios["asset.viewer"]} name={"asset.viewer"} onStopResize={handleResized}>
            <ComponentViewer comp={selectedComp} />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} />
          <ReflexElement flex={flexRatios["asset.details"]} name={"asset.details"} onStopResize={handleResized}>
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
          <ReflexElement flex={flexRatios["asset.comps"]} name={"asset.comps"} onStopResize={handleResized}>
            <ComponentList components={props.entity.components} selectedComp={selectedComp} onSelect={setSelectedCompName} />
          </ReflexElement>
        </ReflexContainer>
    </div>
  )
}

export default AssetDetails;

import React, { useState, useEffect, useContext } from "react";
import Typography from '@mui/material/Typography';
import ComponentViewer from "./ComponentViewer";
import ComponentList from "./ComponentList";
import TagContainer from "./TagContainer";
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import { ConfigContext } from "../../contexts/ConfigContext";
import {ContextContext} from "../../contexts/ContextContext";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex';
import serverRequest from "../../services/serverRequest";
import BuildFileURL from "../../services/BuildFileURL";
import { useSnackbar } from 'notistack';
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu";
import URI from "../../components/URI";
import Path from "../../components/Path";

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
  "asset.details": 0.25,
  "asset.comps": 0.35
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "5px"
}

function AssetDetails(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [selectedCompName, setSelectedCompName] = useState("");
  const [config, setConfig] = useContext(ConfigContext);
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

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

  const handleAddTags = tags => {
    const data = {
      path: BuildFileURL(props.entity.path, config, {pathOnly: true, reverse: true}),
      tags: tags
    };
    serverRequest("add_tags", data).then(resp => {
      if (resp.ok) console.log("done");
      else console.log("failed");
      refreshContext();
    })
  }

  const handleOnDeleteTagClicked = name => {
    const data = {
      path: BuildFileURL(props.entity.path, config, {pathOnly: true, reverse: true}),
      tags: name
    };
    serverRequest("remove_tags", data).then(resp => {
      if (resp.ok) console.log("done");
      else console.log("failed");
      refreshContext();
    })
  }

  const contextItems = [
    {
      label: "Copy tags",
      fn: () =>  CopyToClipboard(props.entity.tags.join(", "), enqueueSnackbar)
    },
    // {
    //   label: "Add tags",
    //   fn: () => ShowInExplorer(props.entity.path, enqueueSnackbar)
    // }
  ]

  return (
    <div style={style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <ReflexContainer orientation="horizontal">
        <ReflexElement flex={flexRatios["asset.viewer"]} name={"asset.viewer"} onStopResize={handleResized}>
          <ComponentViewer comp={selectedComp} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["asset.details"]} name={"asset.details"} onStopResize={handleResized}>
          <div style={{margin: "10px", overflow: "hidden"}}>
            <Typography variant="h5">{props.entity.name}</Typography>
            <div style={rowStyle}>
              <Typography>Path:</Typography>
              <Path path={props.entity.path} />
            </div>
            <div style={rowStyle}>
              <Typography>URI:</Typography>
              <URI uri={props.entity.uri} />
            </div>
          </div>
          <TagContainer entityPath={props.entity.path} tags={props.entity.tags} />
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

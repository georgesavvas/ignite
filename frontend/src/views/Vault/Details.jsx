import React, { useState, useEffect, useContext } from "react"
import styles from "./Details.module.css"
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import saveReflexLayout from "../../utils/saveReflexLayout"
import loadReflexLayout from "../../utils/loadReflexLayout"
// import ComponentViewer from "./ComponentViewer"
import Typography from '@mui/material/Typography'
import Tag, { TagContainer } from "./Tag"
import ComponentList from "./ComponentList"
import { Button, Divider } from "@mui/material"

const splitterStyle = {
  borderColor: "rgb(40,40,40)",
  backgroundColor: "rgb(40,40,40)"
}

const defaultFlexRations = {
  "asset.viewer": 0.4,
  "asset.details": 0.2,
  "asset.comps": 0.4
}

function Details(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations)
  const [selectedCompName, setSelectedCompName] = useState("")

  const selectedAsset = props.selectedAsset;

  useEffect(() => {
    const data = loadReflexLayout()
    if (!data) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const tree = data["home.tree"]
    const explorer = data["home.explorer"]
    const details = data["home.details"]
    if (!tree || !explorer || !details) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const fullWidth = tree[0] + explorer[0] + details[0]
    const ratios = {
      "home.tree": tree[0] / fullWidth,
      "home.explorer": explorer[0] / fullWidth,
      "home.details": details[0] / fullWidth
    }
    setFlexRatios(ratios)
  }, [])

  useEffect(() => {
    if (!selectedAsset) return;
    const comps = selectedAsset.components
    if (comps && comps.length) setSelectedCompName(comps[0].name)
  }, [selectedAsset])

  if (!selectedAsset) return null;

  const handleResized = data => {
    saveReflexLayout(data)
  }

  const getComp = compName => {
    if (!selectedAsset || !selectedAsset.components) return {}
    for(const comp of selectedAsset.components) {
      if (comp.name === compName) return comp
    }
    return {}
  }

  const selectedComp = getComp(selectedCompName)

  return (
    <ReflexContainer>
      <ReflexElement
        flex={flexRatios["asset.viewer"]}
        name="asset.viewer"
        onStopResize={handleResized}
      >
        {/* {selectedAsset ? <ComponentViewer media={selectedAsset.media} /> : null} */}
      </ReflexElement>
      <ReflexSplitter style={splitterStyle} />
      <ReflexElement
        flex={flexRatios["asset.details"]}
        name="asset.details"
        onStopResize={handleResized}
      >
        <div className={styles.assetDetails}>
          <Button
            variant="outlined"
            onClick={() => props.onAssetEdit(selectedAsset)}
            style={{position: "absolute", top: "10px", right: "10px"}}
          >
            Edit
          </Button>
          {/* <Typography variant="h5">Asset Details</Typography> */}
          <Typography align="left">ID: {selectedAsset.id}</Typography>
          <Typography align="left">Name: {selectedAsset.name}</Typography>
          <Typography align="left">Path: {selectedAsset.asset_dir}</Typography>
          {selectedAsset.project ? <Typography align="left">Project: {selectedAsset.project}</Typography> : null}
          {selectedAsset.contributors ? <Typography align="left">Contributors: {selectedAsset.contributors}</Typography> : null}
          <TagContainer style={{marginTop: "10px"}} >
            <Divider sx={{width: "100%", marginTop: "10px", marginBottom: "10px"}} />
            {/* <Typography align="left">Tags:</Typography> */}
            {selectedAsset.tags ? selectedAsset.tags.split(",").map((tag, index) => <Tag name={tag} key={index} />) : null}
          </TagContainer>
        </div>
      </ReflexElement>
      <ReflexSplitter style={splitterStyle} />
      <ReflexElement
        flex={flexRatios["asset.comps"]}
        name="asset.comps"
        onStopResize={handleResized}
      >
        <ComponentList components={selectedAsset.components}
          selectedComp={selectedComp} onSelect={setSelectedCompName}
        />
      </ReflexElement>
    </ReflexContainer>
  )
}

export default Details

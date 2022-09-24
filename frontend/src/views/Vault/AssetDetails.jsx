import React, { useState, useEffect, useContext } from "react";
import Typography from '@mui/material/Typography';
import ComponentViewer from "../DetailsView/ComponentViewer";
import ComponentList from "../DetailsView/ComponentList";
import TagContainer from "../DetailsView/TagContainer";
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import { ConfigContext } from "../../contexts/ConfigContext";
import {VaultContext} from "../../contexts/VaultContext";
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
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import DataPlaceholder from "../../components/DataPlaceholder";

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const versionSelectStyle = {
  minWidth: "150px",
  position: "absolute",
  right: "10px",
  top: "15px"
}

const style = {
  width: "100%",
  height: "100%"
}

const defaultFlexRations = {
  "vault.details.viewer": 0.4,
  "vault.details.details": 0.25,
  "vault.details.comps": 0.35
}

const rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginTop: "5px"
}

const compExtensionPreviewPriority = [
  ".mp4",
  ".mov",
  ".jpg",
  ".jpeg",
  ".png",
  ".tif",
  ".tiff",
  ".exr"
]

function AssetDetails(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [selectedCompName, setSelectedCompName] = useState("");
  const [config, setConfig] = useContext(ConfigContext);
  const {enqueueSnackbar, closeSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [assetVersion, setAssetVersion] = useState();
  const [selectedComp, setSelectedComp] = useState();
  const [vaultContext, setVaultContext, refreshVault] = useContext(VaultContext);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const viewer = data["vault.details.viewer"];
    const details = data["vault.details.details"];
    const comps = data["vault.details.comps"];
    if (!viewer || !details || !comps) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const fullWidth = viewer[1] + details[1] + comps[1];
    const ratios = {
      "vault.details.viewer": viewer[1] / fullWidth,
      "vault.details.details": details[1] / fullWidth,
      "vault.details.comps": comps[1] / fullWidth
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    if (!props.entity || props.entity === null) return;
    setSelectedVersion(props.entity.latest_v)
  }, [props.entity]);

  useEffect(() => {
    if (!props.entity || props.entity === null) return;
    if (!selectedVersion) return;
    const path = `${props.entity.path}/${selectedVersion}`
    serverRequest("get_assetversion", {path: path}).then(resp => {
      const av = resp.data;
      setAssetVersion(av)
      if (!av.components) {
        setSelectedCompName("");
        return;
      }
      av.components.forEach(comp => {
        if (compExtensionPreviewPriority.includes(comp.ext)) {
          setSelectedCompName(comp.filename);
          return;
        }
      })
    })
  }, [props.entity, selectedVersion]);

  useEffect(() => {
    if (!selectedCompName) {
      setSelectedComp()
      return
    }
    setSelectedComp(getComp(selectedCompName));
  }, [selectedCompName])

  const handleResized = data => {
    saveReflexLayout(data)
  }

  const getComp = compName => {
    for(const comp of assetVersion.components) {
      if (comp.filename === compName) return comp;
    }
    return {};
  }

  const handleAddTags = tags => {
    const data = {
      path: BuildFileURL(props.entity.path, config, {pathOnly: true, reverse: true}),
      tags: tags
    };
    serverRequest("add_tags", data).then(resp => {
      if (resp.ok) console.log("done");
      else console.log("failed");
      props.onRefresh();
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
      props.onRefresh();
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

  if (!assetVersion) return <DataPlaceholder text="Fetching data..." />;

  return (
    <div style={style}>
      <ContextMenu items={contextItems} contextMenu={contextMenu}
        setContextMenu={setContextMenu}
      />
      <ReflexContainer orientation="horizontal">
        <ReflexElement flex={flexRatios["vault.details.viewer"]} name={"vault.details.viewer"} onStopResize={handleResized}>
          <ComponentViewer comp={selectedComp} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["vault.details.details"]} name={"vault.details.details"} onStopResize={handleResized}>
          <div style={{margin: "10px", overflow: "hidden"}}>
            <FormControl size="small" style={versionSelectStyle}>
              <InputLabel>Version</InputLabel>
              <Select
                value={selectedVersion}
                label="Version"
                onChange={e => setSelectedVersion(e.target.value)}
              >
                {props.entity.versions.map(ver =>
                  <MenuItem key={ver} value={ver}>{ver}</MenuItem>
                )}
              </Select>
            </FormControl>
            <Typography variant="h5">{assetVersion.name}</Typography>
            {/* <URI uri={assetVersion.uri} /> */}
            <Path path={assetVersion.path} />
          </div>
          <TagContainer entityPath={assetVersion.path} tags={assetVersion.tags || []} onRefresh={refreshVault} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["vault.details.comps"]} name={"vault.details.comps"} onStopResize={handleResized}>
          <ComponentList components={assetVersion.components || []} selectedComp={selectedComp} onSelect={setSelectedCompName} />
        </ReflexElement>
      </ReflexContainer>
    </div>
  )
}

export default AssetDetails;

import React, {useState} from "react";

import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {useSnackbar} from "notistack";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FormControl from "@mui/material/FormControl";
import OutlinedInput from "@mui/material/OutlinedInput";

import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import {CopyToClipboard} from "../ContextActions";
import ContextMenu, {handleContextMenu} from "../../components/ContextMenu";
import openExplorer from "../../utils/openExplorer";
import CopyIcon from "../../icons/CopyIcon";
import styles from "./ComponentList.module.css";


const compIcons = {
  "media/houdini.svg": ["bgeo.sc"],
  "media/image.svg": ["jpg", "jpeg", "png", "tif", "tiff", "exr", "pic", "tx", "tga"],
};

function Component({comp, onSelect, selectedComp, setInfoModal, hidden}) {
  const {enqueueSnackbar} = useSnackbar();
  const [contextMenu, setContextMenu] = useState(null);

  let ext = comp.file.split(".").slice(-1)[0];
  if (comp.file.endsWith(".bgeo.sc")) ext = "bgeo.sc";
  const padding = comp.file.includes("####") ? ".####" : "";

  const containerStyle = {
    // borderColor: comp.name === selectedComp.name ? "rgb(79, 140, 180)" : "rgb(70,70,70)",
    border: comp.name === selectedComp.name ? "solid 2px rgb(79, 140, 180)" : "none"
  };

  const handleClick = e => {
    onSelect(e.currentTarget.id);
  };

  const handleCopy = (e, path) => {
    if (e) e.stopPropagation();
    CopyToClipboard(path, enqueueSnackbar);
  };

  let iconURL = "media/generic_file.png";
  for (const [url, exts] of Object.entries(compIcons)) {
    if (exts.includes(ext)) {
      iconURL = url;
      break;
    }
  }

  const compIconStyle = {
    backgroundImage: `url(${iconURL})`
  };

  const contextItems = [
    {
      "label": "Copy name",
      "fn": () => handleCopy(undefined, comp.name)
    },
    {
      "label": "Copy path",
      "fn": () => handleCopy(undefined, comp.file),
      "divider": true
    },
    {
      "label": "Open in file explorer",
      "fn": () => openExplorer(comp.file, enqueueSnackbar)
    },
  ];

  const handleInfoClick = () => {
    serverRequest("get_component_info", {comp_path: comp.file}).then(resp => {
      setInfoModal({open: true, data: resp.data || "Nada"});
    });
  };

  return (
    <div
      onContextMenu={e => handleContextMenu(e, contextMenu, setContextMenu)}
      style={hidden ? {display: "none"} : null}
    >
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div className={styles.compContainer} id={comp.name} onClick={handleClick} style={containerStyle}>
        <div className={styles.compIcon} style={compIconStyle} />
        <div className={styles.textContainer}>
          <Typography variant="subtitle2" className={styles.label}>{comp.name}{padding}.{ext}</Typography>
        </div>
        <div className={styles.spacer} />
        <IconButton onClick={handleInfoClick}>
          <InfoOutlinedIcon style={{color: "rgb(200, 200, 200", height: "20px", width: "20px"}} />
        </IconButton>
        <IconButton onClick={e => handleCopy(e, comp.file)}>
          <CopyIcon style={{height: "20px", width: "20px"}} />
        </IconButton>
      </div>
    </div>
  );
}

function ComponentList(props) {
  const [infoModal, setInfoModal] = useState({open: false});
  const [filterValue, setFilterValue] = useState("");

  if (!props.components) {
    return (
      <Typography>No Components</Typography>
    );
  }

  return (
    <div className={styles.container}>
      <Modal open={infoModal.open} closeButton onClose={() => setInfoModal({open: false})}>
        <Typography style={{whiteSpace: "pre-line"}}>{infoModal.data}</Typography>
      </Modal>
      <div className={styles.filterBar}>
        <FormControl fullWidth>
          <OutlinedInput
            id="outlined-basic"
            size="small"
            fullWidth
            placeholder="Filter"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value.toLowerCase() || "")}
          />
        </FormControl>
      </div>
      {/* <Typography variant="h5" style={{marginBottom: "10px"}}>Components</Typography> */}
      <div className={styles.compList}>
        {props.components.map((comp, index) => {
          const isHidden = !(comp.name + comp.file).toLowerCase().includes(filterValue);
          return (
            <Component
              key={index}
              comp={comp}
              onSelect={props.onSelect}
              selectedComp={props.selectedComp}
              setInfoModal={setInfoModal}
              hidden={isHidden}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ComponentList;

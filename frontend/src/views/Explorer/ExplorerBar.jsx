import React, {useEffect, useState, useContext} from "react";
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import GridViewIcon from "../../icons/GridViewIcon";
import RowViewIcon from "../../icons/RowViewIcon";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {ContextContext} from "../../contexts/ContextContext";
import DccSelector from "../DccSelector";
import { useSnackbar } from 'notistack';
import Ingest from "../Ingest/Ingest";

const style = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  alignItems: "center",
  gap: "10px"
}

const newSceneDialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      width: "100%",
      maxWidth: "30vw",
      backgroundColor: "rgb(40,40,40)",
      backgroundImage: "none"
    },
  },
}

const ingestDialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      width: "100%",
      maxWidth: "95vw",
      height: "100%",
      maxHeight: "90vh",
      backgroundColor: "rgb(40,40,40)",
      backgroundImage: "none"
    },
  },
}

function ExplorerBar(props) {
  const [newSceneOpen, setNewSceneOpen] = useState(false);
  const [newAssetOpen, setNewAssetOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [contextPath, setContextPath] = useState("");
  const [contextPathError, setContextPathError] = useState([false, ""]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    if (currentContext.path !== undefined) {
      setContextPathError([false, ""]);
      setContextPath(currentContext.path || "");
    }
  },[currentContext]);

  const handleResultTypeChange = (e, value) => {
    if (value !== null) props.onResultTypeChange(value);
  };

  const handleViewTypeChange = (e, value) => {
    if (value !== null) props.onViewTypeChange(value);
  };
  
  const handlePathChange = e => {
    setCurrentContext(e.target.value).then((success => {
      if (!success) {
        setContextPathError([true, "Not found"]);
        enqueueSnackbar("Path not found", {variant: "error"});
      }
    }))
  }

  const handleGoBack = e => {
    setCurrentContext(currentContext.parent);
  }

  return (
    <div>
      <div style={style}>
        <Dialog open={newSceneOpen} onClose={() => setNewSceneOpen(false)} sx={newSceneDialogStyle}>
          <DccSelector task={currentContext.path} newScene={true} />
        </Dialog>
        <Dialog open={ingestOpen} onClose={() => setIngestOpen(false)} sx={ingestDialogStyle}>
          <DialogContent style={{overflow: "hidden"}}>
            <Ingest task={currentContext.path} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIngestOpen(false)}>Close</Button>
            <Button onClick={() => setIngestOpen(false)} color="ignite" variant="outlined">Create</Button>
          </DialogActions>
        </Dialog>
        <Stack direction="row" spacing={1} >
          <ToggleButtonGroup
            color="primary"
            value={props.resultType}
            exclusive
            size="small"
            onChange={handleResultTypeChange}
          >
            <ToggleButton value="dynamic">Dynamic</ToggleButton>
            <ToggleButton value="assets">Assets</ToggleButton>
            <ToggleButton value="scenes">Scenes</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={props.viewType}
            onChange={handleViewTypeChange}
            exclusive
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="row">
              <RowViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <TextField
          id="filterField"
          size="small"
          placeholder="Filter"
          variant="outlined"
          onChange={props.onFilterChange}
          style={{flexGrow: 1}}
        />
        <FormControlLabel control={<Checkbox defaultChecked onChange={props.onLatestChange} />} label="Latest" />
        <Button variant="outlined" onClick={props.onRefresh}>Refresh</Button>
      </div>
      <div style={{...style, padding: "0 10px 10px 10px"}}>
        <Button
            style={{maxWidth: "35px"}}
            variant="outlined"
            onClick={handleGoBack}
            disabled={currentContext.dir_kind === "project"}
          >
            <ArrowUpwardIcon />
        </Button>
        <TextField
          id="outlined-basic"
          size="small"
          fullWidth={true}
          placeholder="Location"
          variant="outlined"
          error={contextPathError[0]}
          // helperText={contextPathError[1]}
          value={contextPath}
          onChange={e => setContextPath(e.target.value)}
          onKeyPress={e => e.key === "Enter" ? handlePathChange(e) : null}
          onBlur={e => handlePathChange(e)}
        />
        <Button
          style={{minWidth: "120px"}}
          color="ignite" 
          variant="outlined"
          onClick={() => setIngestOpen(true)}
        >
          Ingest
        </Button>
        <Button
          style={{minWidth: "120px"}}
          color="ignite"
          variant="outlined"
          disabled={currentContext.dir_kind !== "task"}
          onClick={() => setNewSceneOpen(true)}
        >
          New Scene
        </Button>
      </div>
    </div>
  )
}

export default ExplorerBar;

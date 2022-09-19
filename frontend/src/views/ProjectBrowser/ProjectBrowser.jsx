import { createRef, useState, useContext, useEffect } from "react";
import styles from "./ProjectBrowser.module.css";
import Typography from '@mui/material/Typography';
import {setProject, ContextContext} from "../../contexts/ContextContext";
import Button from '@mui/material/Button';
import { DeleteDir, RenameDir, CreateDir } from "../ContextActions";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import serverRequest from "../../services/serverRequest";
import { ConfigContext } from "../../contexts/ConfigContext";
import Modal from "../../components/Modal";
import ProjectTile, { NewProjectTile } from "./ProjectTile";
import { TextField } from "@mui/material";
import { useSnackbar } from 'notistack';
import { validateDirName } from "../../utils/validateDirName";
import DataPlaceholder from "../../components/DataPlaceholder";

const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: `repeat(auto-fill, minmax(250px, 1fr))`,
  gridGap: "5px",
  padding: "5px"
}

const splitterStyle = {
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)"
}

const Browser = props => {
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    const _tiles = props.loadedData.reduce(function(obj, entity) {
      obj[entity.result_id] = <ProjectTile key={entity.result_id}
        viewType="grid"
        entity={entity}
        onContextMenu={props.handleContextMenuSelection}
        onSelected={props.onProjectSelect}
        selected={""}
      />;
      return obj;
    }, {});
    setTiles(_tiles);
  }, [props]);

  return (
    <div className={styles.container}>
      <div style={tileContainerStyle}>
        <NewProjectTile
          onClick={props.onNewProjectClicked}
        />
        {Object.keys(tiles).map((k) => tiles[k])}
      </div>
    </div>
  )
}

export default function ProjectBrowser(props) {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [modalData, setModalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState([]);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  useEffect(() => {
    if (!props.open) return;
    setIsLoading(true);
    serverRequest("get_projects").then(resp => {
      setIsLoading(false);
      setLoadedData(resp.data);
    });
  }, [props.open, currentContext]);

  const handleNewProject = () => {
    const data = {
      name: newProjectName
    }
    serverRequest("create_project", data).then(resp => {
      if (resp.ok) {
        setProject(newProjectName, setCurrentContext)
        props.onClose()
        setNewProjectName("")
        setNewProjectOpen(false)
        enqueueSnackbar("Project created!", {variant: "success"})
        return;
      }
      enqueueSnackbar(
        `Couldn't create project - ${resp.error}`, {variant: "error"}
      )
    })
  }

  const handleContextMenuSelection = (action, data) => {
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const handleProjectSelect = entity => {
    setProject(entity.name, setCurrentContext);
    props.onClose();
  }

  const handleProjectNameChange = e => {
    const value = validateDirName(e.target.value);
    setNewProjectName(value)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Project Browser"
      maxWidth="xl"
    >
      <Modal open={newProjectOpen} onClose={() => setNewProjectOpen(false)} maxWidth="sm"
        buttons={[<Button key="create" onClick={handleNewProject}>Create</Button>]}
        title="New project name" 
      >
        <TextField onChange={handleProjectNameChange} value={newProjectName} 
          size="small" fullWidth autoFocus
        />
      </Modal>
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, deleteOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, renameOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      {isLoading && !loadedData ? <DataPlaceholder /> :
        <Browser
          {...props}
          onNewProjectClicked={() => setNewProjectOpen(true)}
          onProjectSelect={handleProjectSelect}
          modalData={modalData}
          setModalData={setModalData}
          loadedData={loadedData}
          handleContextMenuSelection={handleContextMenuSelection}
        />
      }
    </Modal>
  )
}

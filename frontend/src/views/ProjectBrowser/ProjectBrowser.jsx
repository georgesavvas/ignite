// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useRef, useState, useContext, useEffect} from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {useSnackbar} from "notistack";

import {validateDirName} from "../../utils/validateDirName";
import DataPlaceholder from "../../components/DataPlaceholder";
import { DeleteDir, RenameDir } from "../ContextActions";
import serverRequest from "../../services/serverRequest";
import Modal from "../../components/Modal";
import ProjectTile, {NewProjectTile} from "./ProjectTile";
import styles from "./ProjectBrowser.module.css";
import {setProject, ContextContext} from "../../contexts/ContextContext";


const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gridGap: "5px",
  padding: "5px"
};

const Browser = props => {
  const [tiles, setTiles] = useState([]);

  useEffect(() => {
    const _tiles = props.loadedData.reduce(function(obj, entity) {
      obj[entity.result_id] = <ProjectTile key={entity.result_id}
        viewType="grid"
        entity={entity}
        onContextMenu={props.handleContextMenuSelection}
        onRefresh={props.onRefresh}
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
  );
};

export default function ProjectBrowser(props) {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [modalData, setModalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState([]);
  const newProjectNameRef = useRef();
  const {enqueueSnackbar} = useSnackbar();

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
    };
    serverRequest("create_project", data).then(resp => {
      if (resp.ok) {
        setProject(newProjectName, setCurrentContext);
        props.onClose();
        setNewProjectName("");
        setNewProjectOpen(false);
        enqueueSnackbar("Project created!", {variant: "success"});
        return;
      }
      enqueueSnackbar(
        `Couldn't create project - ${resp.error}`, {variant: "error"}
      );
    });
  };

  const handleContextMenuSelection = (action, _data) => {
    const data = {..._data};
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const handleProjectSelect = entity => {
    if (entity.name !== currentContext.project) {
      setProject(entity.name, setCurrentContext);
    }
    props.onClose();
  };

  const handleProjectNameChange = e => {
    const value = validateDirName(e.target.value);
    setNewProjectName(value);
  };

  return (
    <Modal open={props.open} onClose={props.onClose} title="Project Browser"
      maxWidth="xl"
    >
      <Modal focusRef={newProjectNameRef} open={newProjectOpen} onClose={() => setNewProjectOpen(false)} maxWidth="sm"
        buttons={[<Button key="create" type="submit">Create</Button>]}
        title="New project name" autoFocus={false} onFormSubmit={handleNewProject}
      >
        <TextField onChange={handleProjectNameChange} value={newProjectName} 
          size="small" fullWidth autoFocus label="New project name" inputRef={newProjectNameRef}
          style={{marginTop: "15px"}}
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
          onRefresh={refreshContext}
          modalData={modalData}
          loadedData={loadedData}
          handleContextMenuSelection={handleContextMenuSelection}
        />
      }
    </Modal>
  );
}

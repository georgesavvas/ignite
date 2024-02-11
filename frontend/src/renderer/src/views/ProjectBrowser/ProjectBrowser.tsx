// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import {
  IgniteComponent,
  IgniteDirectory,
  IgniteEntity,
  InputChangeEvent,
} from "@renderer/types/common";
import { useSnackbar } from "notistack";
import React, { useContext, useEffect, useRef, useState } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import Modal from "../../components/Modal";
import { ContextContext, ContextContextType, setProject } from "../../contexts/ContextContext";
import serverRequest from "../../services/serverRequest";
import { validateDirName } from "../../utils/validateDirName";
import { DeleteDir, RenameDir } from "../ContextActions";
import styles from "./ProjectBrowser.module.css";
import ProjectTile, { NewProjectTile } from "./ProjectTile";

const tileContainerStyle = {
  flexGrow: 1,
  display: "grid",
  overflowY: "auto",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gridGap: "5px",
  padding: "5px",
} as React.CSSProperties;

interface BrowserProps {
  loadedData: IgniteDirectory[];
  modalData: ModalDataType;
  handleContextMenuSelection: (action: string, data: any) => void;
  onRefresh: () => void;
  onProjectSelect: (entity: IgniteEntity | IgniteComponent) => void;
  onNewProjectClicked: () => void;
}

const Browser = (props: BrowserProps) => {
  const [tiles, setTiles] = useState<JSX.Element[]>([]);

  useEffect(() => {
    setTiles(
      props.loadedData.map((entity: IgniteDirectory) => (
        <ProjectTile
          key={entity.project}
          viewType="grid"
          entity={entity}
          onContextMenu={props.handleContextMenuSelection}
          onRefresh={props.onRefresh}
          onSelected={props.onProjectSelect}
        />
      )),
    );
  }, [props]);

  return (
    <div className={styles.container}>
      <div style={tileContainerStyle}>
        <NewProjectTile onClick={props.onNewProjectClicked} />
        {Object.values(tiles)}
      </div>
    </div>
  );
};

type ModalDataType = {
  deleteOpen?: boolean;
  renameOpen?: boolean;
};

interface ProjectBrowserProps {
  open: boolean;
  onClose: () => void;
}

export const ProjectBrowser = (props: ProjectBrowserProps) => {
  const { currentContext, setCurrentContext, refresh } = useContext(
    ContextContext,
  ) as ContextContextType;
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [modalData, setModalData] = useState<ModalDataType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState([]);
  const newProjectNameRef = useRef();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!props.open) return;
    setIsLoading(true);
    serverRequest("get_projects").then((resp) => {
      setIsLoading(false);
      setLoadedData(resp.data || []);
    });
  }, [props.open, currentContext]);

  const handleNewProject = () => {
    const data = {
      name: newProjectName,
    };
    serverRequest("create_project", data).then((resp) => {
      if (resp.ok) {
        setProject(newProjectName, setCurrentContext);
        props.onClose();
        setNewProjectName("");
        setNewProjectOpen(false);
        enqueueSnackbar("Project created!", { variant: "success" });
        return;
      }
      enqueueSnackbar(`Couldn't create project - ${resp.error}`, { variant: "error" });
    });
  };

  const handleContextMenuSelection = (action: string, _data: any) => {
    const data = { ..._data };
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const handleProjectSelect = (entity: IgniteDirectory | IgniteComponent) => {
    if (entity.name !== currentContext.project) {
      setProject(entity.name, setCurrentContext);
    }
    props.onClose();
  };

  const handleProjectNameChange = (e: InputChangeEvent) => {
    const value = validateDirName(e.target.value);
    setNewProjectName(value);
  };

  return (
    <Modal open={props.open} onClose={props.onClose} title="Project Browser" maxWidth="xl">
      <Modal
        focusRef={newProjectNameRef}
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        maxWidth="sm"
        buttons={[
          <Button key="create" type="submit">
            Create
          </Button>,
        ]}
        title="New project name"
        autoFocus={false}
        onFormSubmit={handleNewProject}
      >
        <TextField
          onChange={handleProjectNameChange}
          value={newProjectName}
          size="small"
          fullWidth
          autoFocus
          label="New project name"
          inputRef={newProjectNameRef}
          style={{ marginTop: "15px" }}
        />
      </Modal>
      <DeleteDir
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prevState) => ({ ...prevState, deleteOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <RenameDir
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prevState) => ({ ...prevState, renameOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      {isLoading && !loadedData ? (
        <DataPlaceholder />
      ) : (
        <Browser
          {...props}
          onNewProjectClicked={() => setNewProjectOpen(true)}
          onProjectSelect={handleProjectSelect}
          onRefresh={refresh}
          modalData={modalData}
          loadedData={loadedData}
          handleContextMenuSelection={handleContextMenuSelection}
        />
      )}
    </Modal>
  );
};

export default ProjectBrowser;

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

import CheckIcon from "@mui/icons-material/Check";
import LoadingButton from "@mui/lab/LoadingButton";
import { Divider, Typography } from "@mui/material";
import { InputChangeEvent } from "@renderer/types/common";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";

import FileInput from "../components/FileInput";
import IgnButton from "../components/IgnButton";
import IgnTextField from "../components/IgnTextField";
import Modal from "../components/Modal";
import { Access, ConfigContext, ConfigContextType } from "../contexts/ConfigContext";
import { ContextContext, ContextContextType, setProject } from "../contexts/ContextContext";
import serverRequest from "../services/serverRequest";
import { validateDirName } from "../utils/validateDirName";
import styles from "./Welcome.module.css";

interface WelcomeProps {
  onClose: Function;
  open: boolean;
}

const Welcome = (props: WelcomeProps) => {
  const { setCurrentContext } = useContext(ContextContext) as ContextContextType;
  const { config, setConfig } = useContext(ConfigContext) as ConfigContextType;
  const [access, setAccess] = useState<Access>({
    projectsDir: "",
    serverProjectsDir: "",
  } as Access);
  const [canSave, setCanSave] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectCreated, setProjectCreated] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);

  useEffect(() => {
    setAccess({
      projectsDir: config.access.projectsDir,
      serverProjectsDir: config.access.serverProjectsDir,
    });
  }, [config.access]);

  useEffect(() => {
    const configAccess = _.omit(config.access, ["remote"]);
    const same = _.isEqual(access, config.access);
    console.log("Comparing access", access, configAccess, "same", same);
    setCanSave(!same);
  }, [access]);

  const isServerLocal =
    config.serverDetails.address && config.serverDetails.address.startsWith("localhost");

  const handleAccessChange = (field: keyof Access, value: string | boolean) => {
    setAccess((prev) => {
      const existing = { ...prev };
      if (field === "remote") {
        existing[field] = value as boolean;
      } else existing[field] = value as string;
      if (isServerLocal && field === "projectsDir") {
        existing["serverProjectsDir"] = value as string;
      }
      return existing;
    });
  };

  const handleSave = () => {
    setConfig("access", { ...access }, "modify");
    setCanSave(false);
  };

  const handleNewProject = () => {
    setProjectLoading(true);
    const data = {
      name: newProjectName,
    };
    serverRequest("create_project", data).then((resp) => {
      if (resp.ok) {
        setProject(newProjectName, setCurrentContext);
        props.onClose();
        setNewProjectName("");
        return;
      }
    });
    setProjectLoading(false);
    setProjectCreated(true);
  };

  const handleProjectNameChange = (e: InputChangeEvent) => {
    const value = validateDirName(e.target.value);
    setNewProjectName(value);
  };

  return (
    <Modal open={props.open} maxWidth="sm" onClose={() => props.onClose()}>
      <div className={styles.container}>
        <Typography variant="h4">Welcome to Ignite!</Typography>
        <div className={styles.section}>
          <Typography variant="h5">Check the docs</Typography>
          <div className={styles.row}>
            <Typography
              onClick={() => window.services.open_url("https://docs.ignitevfx.co.uk")}
              sx={{ cursor: "pointer" }}
              color="rgb(252, 140, 3)"
            >
              docs.ignitevfx.co.uk
            </Typography>
          </div>
        </div>
        <Divider />
        <div className={styles.section}>
          <Typography variant="h5">Set your projects directory</Typography>
          <div className={styles.row}>
            <FileInput
              label="Projects directory"
              size="small"
              fullWidth
              disabled={access.remote}
              value={access.projectsDir || ""}
              onChange={(_: any, value: string) => handleAccessChange("projectsDir", value)}
              buttonStyle={{ marginTop: "4px" }}
            >
              <IgnButton
                color="ignite"
                size="medium"
                onClick={() => handleSave()}
                sx={{ height: "37.5px", marginTop: "4px" }}
                disabled={!canSave}
              >
                Save
              </IgnButton>
            </FileInput>
          </div>
        </div>
        <Divider />
        <div className={styles.section}>
          <Typography variant="h5">Create your first project</Typography>
          <div className={styles.row}>
            <IgnTextField
              label="Project Name"
              fullWidth
              value={newProjectName}
              onChange={handleProjectNameChange}
              disabled={projectLoading || projectCreated}
            />
            {!projectCreated ? (
              <LoadingButton
                color="ignite"
                onClick={handleNewProject}
                loading={projectLoading}
                variant="outlined"
              >
                Create
              </LoadingButton>
            ) : (
              <IgnButton variant="outlined" color="success">
                <CheckIcon />
              </IgnButton>
            )}
          </div>
        </div>
        <Divider />
        <div className={styles.section}>
          <Typography variant="h5">Get support</Typography>
          <div className={styles.row}>
            <img
              src="src/assets/discord.svg"
              className={styles.discord}
              onClick={() => window.services.open_url("https://discord.gg/2HWQduERrJ")}
            />
          </div>
        </div>
      </div>
      <IgnButton
        color="ignite"
        sx={{ position: "absolute", bottom: "15px", right: "15px" }}
        onClick={() => props.onClose()}
      >
        Close
      </IgnButton>
    </Modal>
  );
};

export default Welcome;

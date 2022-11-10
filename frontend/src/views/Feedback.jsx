// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, { useContext, useEffect, useState } from "react";

import { Divider, IconButton, Link, Typography } from "@mui/material";
import LoadingButton from "@mui/lab/LoadingButton";
import CheckIcon from "@mui/icons-material/Check";
import EmailIcon from "@mui/icons-material/Email";

import {validateDirName} from "../utils/validateDirName";
import FileInput from "../components/FileInput";
import IgnButton from "../components/IgnButton";
import Modal from "../components/Modal";
import styles from "./Feedback.module.css";
import IgnTextField from "../components/IgnTextField";
import serverRequest from "../services/serverRequest";
import {ConfigContext} from "../contexts/ConfigContext";
import {setProject, ContextContext} from "../contexts/ContextContext";


const Feedback = props => {
  const [,,setCurrentContext] = useContext(ContextContext);
  const [config, setConfig] = useContext(ConfigContext);
  const [access, setAccess] = useState({});
  const [canSave, setCanSave] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectCreated, setProjectCreated] = useState();
  const [projectLoading, setProjectLoading] = useState();

  useEffect(() => {
    setAccess({
      projectsDir: config.access.projectsDir,
      serverProjectsDir: config.access.serverProjectsDir
    });
  }, [config.access]);

  useEffect(() => {
    let changed = false;
    const configAccess = {...config.access};
    delete configAccess.remote;
    if (
      JSON.stringify(configAccess) !==
      JSON.stringify(access)
    ) changed = true;
    setCanSave(changed);
  }, [access]);

  const isServerLocal = config.serverDetails.address &&
    config.serverDetails.address.startsWith("localhost");

  const handleAccessChange = (field, value) => {
    setAccess(prevState => {
      const existing = {...prevState};
      existing[field] = value;
      if (isServerLocal && field === "projectsDir") {
        existing["serverProjectsDir"] = value;
      }
      return existing;
    });
  };

  const handleSave = () => {
    setConfig("access", {...access});
    setCanSave(false);
  };

  const handleNewProject = () => {
    setProjectLoading(true);
    const data = {
      name: newProjectName
    };
    serverRequest("create_project", data).then(resp => {
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

  const handleProjectNameChange = e => {
    const value = validateDirName(e.target.value);
    setNewProjectName(value);
  };

  return (
    <Modal open={props.open} maxWidth="md" onClose={() => props.onClose()}>
      <div className={styles.container}>
        <Typography variant="h4">Feedback</Typography>
        <Typography variant="h5">
          {"Your input is greatly appreciated! Feel free to propose changes, \
            new features, report bugs or just give your opinion!"
          }
        </Typography>
        <Divider className={styles.divider}>
          Use one of the following ways to get in touch
        </Divider>
        <div className={styles.section}>
          <div className={styles.row}>
            <img
              src="media/discord.svg"
              className={styles.discord}
              onClick={
                () => window.services.open_url("https://discord.gg/2HWQduERrJ")
              }
            />
            <div>
              <img
                src="media/github_mark.png"
                className={styles.github}
                onClick={() => window.services.open_url(
                  "https://github.com/georgesavvas/ignite/issues"
                )}
              />
              <img
                src="media/github_logo.png"
                className={styles.github}
                onClick={() => window.services.open_url(
                  "https://github.com/georgesavvas/ignite/issues"
                )}
              />
            </div>
            <div className={styles.email}>
              <EmailIcon className={styles.emailIcon} color="ignite"
                onClick={() =>
                  window.services.open_url("mailto:feedback@ignite.co.uk")}
              />
              <Typography style={{color: "rgb(252, 140, 3)"}}>
                feedback@ignite.co.uk
              </Typography>
            </div>
          </div>
        </div>
        {/* <Divider className={styles.divider}>or use the form</Divider>
        <div className={styles.section}>
          <div className={styles.row}>
            <IgnTextField label="Name (optional)" fullWidth />
            <IgnTextField label="Email (optional)" fullWidth />
          </div>
          <div className={styles.row}>
            <IgnTextField label="Feedback" fullWidth multiline minRows={5}
              maxRows={15}
            />
          </div>
          <div className={styles.row}>
            <IgnButton color="ignite">Submit</IgnButton>
          </div>
        </div> */}
      </div>
    </Modal>
  );
};

export default Feedback;

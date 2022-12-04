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

import {Divider, Typography} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";

import Modal from "../components/Modal";
import styles from "./Feedback.module.css";
import {ConfigContext} from "../contexts/ConfigContext";


const Feedback = props => {
  const [config] = useContext(ConfigContext);
  const [access, setAccess] = useState({});
  const [, setCanSave] = useState(false);

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

  return (
    <Modal open={props.open} maxWidth="md" onClose={() => props.onClose()}>
      <div className={styles.container}>
        <Typography variant="h4">Feedback</Typography>
        <Typography variant="h5">
          {"Your input is greatly appreciated! Feel free to propose changes, \
            new features, report bugs or just give your opinion!"
          }
        </Typography>
        <Divider className={styles.divider} />
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
                  "https://github.com/georgesavvas/ignite/discussions"
                )}
              />
              <img
                src="media/github_logo.png"
                className={styles.github}
                onClick={() => window.services.open_url(
                  "https://github.com/georgesavvas/ignite/discussions"
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

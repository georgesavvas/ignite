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

import HelpIcon from "@mui/icons-material/Help";
import SettingsIcon from "@mui/icons-material/Settings";
import { Typography } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import { useContext, useEffect, useState } from "react";

import IgnButton from "../../components/IgnButton.js";
import Modal from "../../components/Modal.js";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext.js";
import CratesDropdown from "../Crates/CratesDropdown.js";
import DccSelector from "../DccSelector.jsx";
import Feedback from "../Feedback.jsx";
import ProjectBrowser from "../ProjectBrowser/ProjectBrowser.js";
import Settings from "../Settings/Settings.js";
import Vault from "../Vault/Vault.jsx";
import styles from "./TopBar.module.css";

export const TopBar = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [dccOpen, setDccOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { refresh } = useContext(ContextContext) as ContextContextType;
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    window.services.get_version().then((resp: any) => setAppVersion(resp));
  }, []);

  const handleVaultClose = () => {
    setVaultOpen(false);
    refresh();
  };

  return (
    <>
      <Vault open={vaultOpen} onClose={handleVaultClose} />
      <ProjectBrowser open={projectBrowserOpen} onClose={() => setProjectBrowserOpen(false)} />
      <Modal open={dccOpen} onClose={() => setDccOpen(false)} maxWidth="xs">
        <DccSelector onClose={() => setDccOpen(false)} />
      </Modal>
      <Feedback open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className={styles.container}>
        <div className={styles.leftSide}>
          <IgnButton
            variant="outlined"
            color="ignite"
            style={{ minWidth: "180px" }}
            onClick={() => setProjectBrowserOpen(true)}
          >
            Project Browser
          </IgnButton>
          <IgnButton variant="outlined" color="ignite" onClick={() => setVaultOpen(true)}>
            Vault
          </IgnButton>
          <IgnButton
            variant="outlined"
            color="ignite"
            style={{ minWidth: "120px" }}
            onClick={() => setDccOpen(true)}
          >
            Launch App
          </IgnButton>
        </div>
        <div className={styles.logoContainer}>
          <img src="src/assets/ignite_logo.png" className={styles.logo} />
          <Typography style={{ color: "rgb(60,60,60)", alignSelf: "flex-end" }} variant="caption">
            v{appVersion}
          </Typography>
        </div>
        <div className={styles.rightSide}>
          <CratesDropdown />
          <div style={{ flexGrow: 1 }} />
          <IconButton size="small" style={{ padding: 0 }} onClick={() => setFeedbackOpen(true)}>
            <div className={styles.feedbackIcon} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => window.services.open_url("https://docs.ignitevfx.co.uk/")}
          >
            <HelpIcon style={{ fontSize: "30px" }} />
          </IconButton>
          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon style={{ fontSize: "30px" }} />
          </IconButton>
        </div>
      </div>
    </>
  );
};

export default TopBar;

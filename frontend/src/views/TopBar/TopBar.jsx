import React, {useState} from "react";

import IconButton from "@mui/material/IconButton";
import HelpIcon from "@mui/icons-material/Help";
import SettingsIcon from "@mui/icons-material/Settings";

import Settings from "../Settings/Settings.jsx";
import ProjectBrowser from "../ProjectBrowser/ProjectBrowser";
import Vault from "../Vault/Vault";
import styles from "./TopBar.module.css";
import IgnButton from "../../components/IgnButton";


export default function TopBar() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);

  return (
    <>
      <Vault open={vaultOpen} onClose={() => setVaultOpen(false)} />
      <ProjectBrowser
        open={projectBrowserOpen}
        onClose={() => setProjectBrowserOpen(false)}
      />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className={styles.container}>
        <div className={styles.leftSide}>
          <IgnButton
            variant="outlined"
            color="ignite"
            style={{minWidth: "180px"}}
            onClick={() => setProjectBrowserOpen(true)}
          >
            Project Browser
          </IgnButton>
          <IgnButton variant="outlined" color="ignite" onClick={() => setVaultOpen(true)}>Vault</IgnButton>
        </div>
        <div className={styles.logoContainer}>
          <img src="media/ignite_logo.png" className={styles.logo} />
        </div>
        <div className={styles.rightSide}>
          <IconButton size="small" style={{padding: 0}}>
            <div className={styles.feedbackIcon} />
          </IconButton>
          <IconButton size="small"
            onClick={() => window.services.open_url("https://docs.ignitevfx.co.uk/")}
          >
            <HelpIcon style={{fontSize: "30px"}} />
          </IconButton>
          <IconButton size="small"
            onClick={() => setSettingsOpen(true)}>
            <SettingsIcon style={{fontSize: "30px"}} />
          </IconButton>
        </div>
      </div>
    </>
  );
}

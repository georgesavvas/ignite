import React, {useEffect, useState, useContext} from "react";
import styles from "./TopBar.module.css";
import IgnButton from "../../components/IgnButton";
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import BugReportIcon from '@mui/icons-material/BugReport';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import SettingsIcon from '@mui/icons-material/Settings';
import Settings from "../Settings/Settings.jsx";
import ProjectBrowser from "../ProjectBrowser/ProjectBrowser";
import Vault from "../Vault/Vault";

function FeedbackIcon() {
  const style = {
    height: "40px",
    width: "40px",
    margin: "auto",
    objectFit: "contain"
  }
  return (
    <img src="media/feedback.png" style={style} />
  )
}

const vaultDialogStyle = {
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

export default function TopBar() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
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
          <ButtonGroup variant="text" >
            <IconButton>
              <HelpIcon />
            </IconButton>
            <IconButton>
              <BugReportIcon />
            </IconButton>
            <IconButton>
              <ThumbsUpDownIcon />
              {/* <FeedbackIcon /> */}
            </IconButton>
            <IconButton style={{marginLeft: "10px"}} onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </ButtonGroup>
        </div>
      </div>
    </>
  );
}

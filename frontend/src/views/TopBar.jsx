import React, {useEffect, useState, useContext} from "react";
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Skeleton from '@mui/material/Skeleton';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import styles from "./TopBar.module.css";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import BugReportIcon from '@mui/icons-material/BugReport';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsDialog from "./SettingsDialog.jsx";
import {ProjectContext} from "../contexts/ProjectContext";
import ProjectBrowser from "./ProjectBrowser";
import serverRequest from "../services/serverRequest";

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

export default function TopBar() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);

  return (
    <>
      <ProjectBrowser
        open={projectBrowserOpen}
        onClose={() => setProjectBrowserOpen(false)}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className={styles.container}>
        <div className={styles.leftSide}>
          <Button
            variant="outlined"
            color="ignite"
            style={{minWidth: "180px"}}
            onClick={() => setProjectBrowserOpen(true)}
          >
            Project Browser
          </Button>
          <Button variant="outlined" color="ignite">Vault</Button>
        </div>
        <div className={styles.logoContainer}>
          <img src="media/ignite_logo.png" className={styles.logo} />
        </div>
        <div className={styles.rightSide}>
          <ButtonGroup variant="text">
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

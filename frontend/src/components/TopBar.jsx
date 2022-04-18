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
import ProjectBrowser from "../views/ProjectBrowser";

export default function TopBar() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectBrowserOpen, setProjectBrowserOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useContext(ProjectContext);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      "http://127.0.0.1:9090/api/v1/get_project_names", {
        method: "GET",
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      }
    )
    .then((resp) => {
      return resp.json();
    })
    .then((resp) => {
      setIsLoading(false);
      setProjects(resp.data);
      if (selectedProject === "" && resp.data.length > 0) setSelectedProject(resp.data[0])
    });
  }, []);

  const handleChange = (event) => {
    setSelectedProject(event.target.value);
  };

  return (
    <div className={styles.container}>
      <ProjectBrowser
        open={projectBrowserOpen}
        onClose={() => setProjectBrowserOpen(false)}
      />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {/* <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
        <Select
          labelId="demo-simple-select-standard-label"
          id="demo-simple-select-standard"
          value={selectedProject}
          onChange={handleChange}
          label="Age"
        >
          {projects.map(project => (
            <MenuItem key={project} value={project}>{project}</MenuItem>
          ))}
        </Select>
      </FormControl> */}
      <div className={styles.buttonsRight}>
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
        <img src="media/ignite_header.png" className={styles.logo} />
      </div>
      <ButtonGroup variant="text" style={{width: "300px", justifyContent: "flex-end"}}>
        <IconButton aria-label="docs">
          <HelpIcon />
        </IconButton>
        <IconButton aria-label="bug">
          <BugReportIcon />
        </IconButton>
        <IconButton aria-label="feedback">
          <ThumbsUpDownIcon />
        </IconButton>
        <IconButton aria-label="settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon fontSize="large"/>
        </IconButton>
      </ButtonGroup>
    </div>
  );
}

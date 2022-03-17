import React, {useEffect, useState, useContext} from "react";
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Skeleton from '@mui/material/Skeleton';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import styles from "./ProjectBar.module.css";
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import BugReportIcon from '@mui/icons-material/BugReport';
import ThumbsUpDownIcon from '@mui/icons-material/ThumbsUpDown';
import {ProjectContext} from "../contexts/ProjectContext";
import {ContextContext} from "../contexts/ContextContext";

export default function ProjectBar() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [currentLocation, setCurrentLocation] = useState("");
  const [selectedProject, setSelectedProject] = useContext(ProjectContext);
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      "http://127.0.0.1:5000/api/v1/get_projects", {
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
    });
  }, []);

  useEffect(() => {
    if (currentContext.path !== undefined) {
      setCurrentLocation(currentContext.path);
    }
  },[currentContext]);

  const handleChange = (event) => {
    setSelectedProject(event.target.value);
  };

  const handleLocationChange = (event) => {
    setCurrentLocation(event.target.value);
  }

  return (
    <div className={styles.container}>
      <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
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
      </FormControl>
      <div className={styles.filterBarContainer}>
        <TextField
          id="outlined-basic"
          size="small"
          fullWidth={true}
          placeholder="Location"
          variant="outlined"
          value={currentLocation}
          onChange={handleLocationChange}
        />
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
      </ButtonGroup>
    </div>
  );
}

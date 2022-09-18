import { TextField, Typography } from '@mui/material';
import React from 'react';
import styles from "./ProjectCreator.module.css";

const ProjectCreator = props => {
  return (
    <div className={styles.container}>
      <Typography align="center">New Project</Typography>
      <TextField
        label="Project Name"
        size="small"
        fullWidth
      />
    </div>
  )
}

export default ProjectCreator

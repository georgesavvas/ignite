import styles from "./Settings.module.css";
import { ListItemIcon, ListItemText, Typography, Divider, MenuItem, MenuList } from '@mui/material'
import React from 'react';
import Modal from '../../components/Modal';
import { useState } from "react";
import Dcc from "./Dcc";
import General from "./General";

const settingOptions = ["General", "DCC"];

const Settings = props => {
  const [selectedOption, setSelectedOption] = useState("General");

  const getSettings = () => {
    switch (selectedOption) {
      default:
        return <General />
      case "DCC":
        return <Dcc />
    }
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Settings"
      maxWidth="lg"
    >
      <div className={styles.container}>
        <div className={styles.menuContainer}>
          <MenuList>
            {settingOptions.map((option, index) => 
              <MenuItem key={index} name={option}
                onClick={() => setSelectedOption(option)}
                className={`
                  ${styles.option}
                  ${selectedOption === option ? styles.selected : ""}
                `}
              >
                <ListItemText>{option}</ListItemText>
              </MenuItem>
            )}
          </MenuList>
        </div>
        <Divider flexItem orientation="vertical" />
        <div className={styles.settingsContainer}>
          {getSettings()}
        </div>
      </div>
    </Modal>
  )
}

export default Settings
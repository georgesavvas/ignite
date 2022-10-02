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


import React, {useState} from "react";

import {ListItemText, Divider, MenuItem, MenuList} from "@mui/material";

import styles from "./Settings.module.css";
import Modal from "../../components/Modal";
import Dcc from "./Dcc";
import General from "./General";


const settingOptions = ["General", "DCC"];

const Settings = props => {
  const [selectedOption, setSelectedOption] = useState("General");

  const getSettings = () => {
    switch (selectedOption) {
    default:
      return <General />;
    case "DCC":
      return <Dcc />;
    }
  };

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
  );
};

export default Settings;
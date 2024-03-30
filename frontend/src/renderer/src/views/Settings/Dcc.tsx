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

import Clear from "@mui/icons-material/Clear";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { ClickEvent, DccType, InputChangeEvent } from "@renderer/types/common";
import { debounce } from "lodash";
import { useContext, useEffect, useRef, useState } from "react";

import FileInput from "../../components/FileInput";
import { ConfigContext, ConfigContextType, DccConfig } from "../../contexts/ConfigContext";
import clientRequest from "../../services/clientRequest";
import styles from "./Dcc.module.css";

const debounced = debounce((fn) => fn(), 1000);

const placeholder_config = {
  path: "",
  exts: "",
  name: "",
};

type DccChangeEventType = {
  index: number;
  field?: string;
  value?: string;
};

const Dcc = () => {
  const { config, setConfig } = useContext(ConfigContext) as ConfigContextType;
  const [dcc, setDcc] = useState<DccConfig>([]);
  const shouldWrite = useRef(false);

  useEffect(() => {
    if (!Array.isArray(config.dccConfig)) {
      console.log("DCC Config is corrupt, resetting...");
      setDcc([placeholder_config]);
      setConfig("dccConfig", [placeholder_config], "modify");
    }
    setDcc(config.dccConfig);
  }, []);

  useEffect(() => {
    if (!shouldWrite.current) return;
    debounced(() => {
      setConfig("dccConfig", dcc, "modify");
    });
  }, [dcc]);

  const handleDccAdd = (data?: DccType[]) => {
    if (!data || !data.length) {
      setDcc((prev) => [placeholder_config, ...prev]);
      return;
    }
    let existing_paths = [] as string[];
    dcc.forEach((existing) => {
      existing_paths.push(existing.path);
    });
    const filtered = data.filter((new_dcc) => !existing_paths.includes(new_dcc.path));
    setDcc((prev) => [...prev, ...filtered]);
  };

  const handleDccModify = (data: DccChangeEventType) => {
    setDcc((prev) => {
      if (!data.field || data.value === undefined) return prev;
      let dcc_copy = [...prev];
      let index_copy = { ...dcc_copy[data.index] };
      if (["exts", "scenes"].includes(data.field)) {
        index_copy[data.field] = data.value.trim().split(",");
      } else {
        index_copy[data.field] = data.value;
      }
      dcc_copy[data.index] = index_copy;
      return dcc_copy;
    });
  };

  const handleDccRemove = (data: DccChangeEventType) => {
    setDcc((prev) => {
      let cc = [...prev];
      cc.splice(data.index, 1);
      return cc;
    });
  };

  const handleDccConfigChange = (e: InputChangeEvent) => {
    const s = e.currentTarget.id.split("-");
    const target_id = parseInt(s[1]);
    const target_field = s[0];
    let value = e.target.value;
    const data = {
      index: target_id,
      field: target_field,
      value: value,
    };
    shouldWrite.current = true;
    handleDccModify(data);
  };

  const handleDccConfigPathChange = (index: number, value: string) => {
    const data = {
      index: index,
      field: "path",
      value: value,
    };
    shouldWrite.current = true;
    handleDccModify(data);
  };

  const handleRemoveDcc = (e: ClickEvent) => {
    const target_id = parseInt(e.currentTarget.id.split("-")[1]);
    const data = { index: target_id } as DccChangeEventType;
    shouldWrite.current = true;
    handleDccRemove(data);
  };

  const handleAddDcc = () => {
    shouldWrite.current = true;
    handleDccAdd();
  };

  const handleDiscoverDcc = () => {
    clientRequest("discover_dcc").then((resp) => {
      const new_config = resp.data;
      let existing_paths = [] as string[];
      config.dccConfig.forEach((config) => {
        existing_paths.push(config.path);
      });
      const filtered = new_config.filter(
        (config: DccType) => !existing_paths.includes(config.path)
      );
      console.log(
        `Previously had ${existing_paths.length} configs,
        discovered ${new_config.length}, adding ${filtered.length}`
      );
      setConfig("dccConfig", filtered, "add");
      setDcc((prev) => [...prev, ...filtered]);
    });
  };

  const renderDcc = (dcc_: DccType, index: number) => {
    return (
      <ListItem key={index}>
        <IconButton
          color="primary"
          component="span"
          id={"remove-" + index}
          onClick={handleRemoveDcc}
        >
          <Clear style={{ color: "red", fontSize: "2rem" }} />
        </IconButton>
        <Divider flexItem orientation="vertical" />
        <div className={styles.gridContainer}>
          <div className={styles.gridItemPath}>
            <FileInput
              id={"path-" + index}
              label="Executable"
              fullWidth
              value={dcc_.path || ""}
              size="small"
              onChange={(_, value) => handleDccConfigPathChange(index, value)}
              className={styles.textField}
            />
          </div>
          <div className={styles.gridItemName}>
            <TextField
              margin="dense"
              id={"name-" + index}
              label="Name"
              variant="outlined"
              fullWidth
              value={dcc_.name || ""}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input,
              }}
            />
          </div>
          <div className={styles.gridItemScenes}>
            <TextField
              margin="dense"
              id={"scenes-" + index}
              label="Scene extensions"
              fullWidth
              variant="outlined"
              value={dcc_.scenes || ""}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input,
              }}
            />
          </div>
          <div className={styles.gridItemExts}>
            <TextField
              margin="dense"
              id={"exts-" + index}
              label="Also show for"
              fullWidth
              variant="outlined"
              value={dcc_.exts || ""}
              size="small"
              onChange={handleDccConfigChange}
              className={styles.textField}
              InputProps={{
                className: styles.input,
              }}
            />
          </div>
        </div>
      </ListItem>
    );
  };

  return (
    <div className={styles.container}>
      <Stack direction="row" alignItems="center" spacing={2} style={{ alignSelf: "flex-end" }}>
        <Button variant="outlined" onClick={handleAddDcc}>
          Add
        </Button>
        <Button variant="outlined" onClick={handleDiscoverDcc}>
          Discover
        </Button>
      </Stack>
      <List sx={{ width: "100%" }}>
        {Array.isArray(dcc) ? dcc.map((dcc_, index) => renderDcc(dcc_, index)) : null}
      </List>
    </div>
  );
};

export default Dcc;

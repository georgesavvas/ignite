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

import ClearIcon from "@mui/icons-material/Clear";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import LinearProgress from "@mui/material/LinearProgress";
import { EnqueueSnackbar, InputChangeEvent } from "@renderer/types/common";
import debounce from "lodash.debounce";
import { useContext, useEffect, useState } from "react";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import Xarrow, { Xwrapper, useXarrow } from "react-xarrows";

import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import clientRequest from "../../services/clientRequest";
import loadReflexLayout from "../../utils/loadReflexLayout";
import saveReflexLayout from "../../utils/saveReflexLayout";
import Files from "./Files";
import styles from "./Ingest.module.css";
import Output from "./Output";
import Rules from "./Rules";

const splitterStyle = {
  borderStyle: "solid",
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
  boxSizing: "border-box",
} as React.CSSProperties;

const defaultFlexRations = {
  "ingest.files": 0.35,
  "ingest.rules": 0.3,
  "ingest.output": 0.35,
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getRandomColour() {
  var h = rand(1, 36) * 10;
  var s = rand(20, 50);
  var l = rand(10, 30);
  return `hsl(${h},${s}%,${l}%)`;
}

const getFilesDebounced = debounce((data: any, callback: (resp: any) => void) => {
  clientRequest("ingest_get_files", data).then((resp) => {
    callback(resp);
  });
}, 250);

const getOutputDebounced = debounce((data: any, callback: (resp: any) => void) => {
  clientRequest("ingest", data).then((resp) => {
    callback(resp);
  });
}, 500);

const ingestDialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      width: "100%",
      maxWidth: "95vw",
      height: "100%",
      maxHeight: "90vh",
      backgroundColor: "rgb(20,20,20)",
      backgroundImage: "none",
    },
  },
};

export type RuleType {
  colour: string,
  file_target: string,
  file_target_type: string,
  show_connections: boolean,
  task: string,
  name: string,
  comp: string,
  rule: string,
  replace_target: string,
  replace_value: string,
  origIndex: number,
}

interface IngestProps {
  open: boolean;
  path?: string;
  enqueueSnackbar: EnqueueSnackbar;
  onClose: () => void;
}

const Ingest = (props: IngestProps) => {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [ingestDirs, setIngestDirs] = useState("");
  const [ingestFiles, setIngestFiles] = useState([]);
  const [ingestAssets, setIngestAssets] = useState([]);
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const updateXarrow = useXarrow();
  const { currentContext, refresh } = useContext(ContextContext) as ContextContextType;
  const RULETEMPLATE = {
    file_target: "*",
    file_target_type: "filename",
    task: props.path || currentContext.path,
    name: "{name}",
    comp: "{comp}",
    rule: "{name}/{comp}.{ext}",
    replace_target: "",
    replace_value: "",
    show_connections: true,
  };
  const getNewRule = () => [{ ...RULETEMPLATE, colour: getRandomColour() }];
  const [ingestRules, setIngestRules] = useState(getNewRule());

  useEffect(() => {
    if (props.open) return;
    setIngestDirs("");
    setIngestFiles([]);
    setIngestRules(getNewRule());
    setIngestAssets([]);
  }, [props.open]);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const files = data["ingest.files"];
    const rules = data["ingest.rules"];
    const output = data["ingest.output"];
    if (!files || !rules || !output) {
      setFlexRatios(defaultFlexRations);
      return;
    }
    const fullWidth = files[0] + rules[0] + output[0];
    const ratios = {
      "ingest.files": files[0] / fullWidth,
      "ingest.rules": rules[0] / fullWidth,
      "ingest.output": output[0] / fullWidth,
    };
    setFlexRatios(ratios);
  }, []);

  useEffect(() => {
    if (!props.open) return;
    setLoading(true);
    getFiles();
    getOutput();
  }, [ingestDirs]);

  useEffect(() => {
    if (!props.open) return;
    getOutput();
  }, [ingestRules]);

  const handleResize = (data: any) => {
    saveReflexLayout(data);
  };

  const getFiles = () => {
    setLoading(true);
    getFilesDebounced({ dirs: ingestDirs }, (resp: any) => {
      setIngestFiles(resp.data?.trimmed || []);
      setLoading(false);
    });
  };

  const getOutput = () => {
    setLoading(true);
    const data = {
      dirs: ingestDirs,
      rules: ingestRules,
      dry: true,
    };
    getOutputDebounced({ data: data }, (resp: any) => {
      setIngestAssets(resp.data?.assets || []);
      setConnections(resp.data?.connections || []);
      setLoading(false);
    });
  };

  const handleDirsChange = (value: string) => {
    setIngestDirs(value);
  };

  const handleRulesChange = (e: InputChangeEvent, action: string, index = -1, index2 = -1) => {
    let field: string;
    let id: string;
    let value: string | boolean;
    if (e && e !== null) {
      [field, id] = e.target.name.split("-");
      value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    }
    switch (action) {
      case "add":
        setIngestRules((prevState) => {
          const rule = { ...RULETEMPLATE, colour: getRandomColour() };
          return [...prevState, rule];
        });
        break;
      case "remove":
        setIngestRules((prevState) => {
          const rules = [...prevState];
          if (index < 0) rules.pop();
          else rules.splice(index, 1);
          return rules;
        });
        break;
      case "modify":
        setIngestRules((prevState) => {
          const existing = [...prevState];
          existing[id][field] = value;
          return existing;
        });
        break;
      case "swap":
        setIngestRules((prevState) => {
          const rules = [...prevState];
          [rules[index], rules[index2]] = [rules[index2], rules[index]];
          return rules;
        });
        break;
      case "move":
        setIngestRules((prevState) => {
          const rules = [...prevState];
          const ruleToMove = rules.splice(index, 1)[0];
          rules.splice(index2, 0, ruleToMove);
          return rules;
        });
        break;
    }
  };

  function handleCreate() {
    setLoading(true);
    const data = {
      dirs: ingestDirs,
      rules: ingestRules,
      dry: false,
    };
    clientRequest("ingest", { data: data }).then((resp) => {
      if (resp.ok) {
        props.enqueueSnackbar("Ingested!", { variant: "success" });
      } else {
        props.enqueueSnackbar("Ingest failed.", { variant: "error" });
      }
      setLoading(false);
      refresh();
      props.onClose();
    });
  }

  const getConnectionArrows = (side: string) => {
    if (loading) return [];
    const isFiles = side == "files";
    const ruleConnections = isFiles ? connections?.rules_files : connections?.rules_assets;
    if (!ruleConnections || !ruleConnections.length) {
      return [];
    }
    // const ruleIndex = isFiles ? 0 : 1;
    const startAnchorStyle = isFiles
      ? { position: "left", offset: { x: 0 } }
      : { position: "right", offset: { x: 15 } };
    const endAnchorStyle = isFiles
      ? { position: "right", offset: { x: 40 } }
      : { position: "left", offset: { x: -25 } };
    const filtered = ruleConnections.filter((conn) => {
      return ingestRules[conn[0]]?.show_connections;
    });
    return filtered.map((conn, index) => {
      const rule = ingestRules[conn[0]];
      const startId = "rule-" + conn[0];
      const endId = `${isFiles ? "file" : "asset"}-${conn[1]}`;
      if (!isFiles) console.log(rule, startId, endId);
      return (
        <Xarrow
          start={startId}
          end={endId}
          color={rule.colour}
          key={index}
          strokeWidth={2}
          curveness={0.5}
          headSize={3}
          headShape="circle"
          showHead={true}
          animateDrawing={0.25}
          startAnchor={startAnchorStyle}
          endAnchor={endAnchorStyle}
        />
      );
    });
  };

  return (
    <Dialog open={props.open} onClose={props.onClose} sx={ingestDialogStyle}>
      <ClearIcon onClick={props.onClose} className={styles.closeButtonStyle} />
      <DialogContent style={{ overflow: "hidden" }}>
        <div className={styles.container}>
          <Xwrapper>
            <ReflexContainer orientation="vertical">
              <ReflexElement
                flex={flexRatios["ingest.files"]}
                name="ingest.files"
                onStopResize={handleResize}
              >
                <div className={styles.row}>
                  <Files files={ingestFiles} onDirsChange={handleDirsChange} />
                  <div className={styles.connectionContainer}>
                    {getConnectionArrows("files")}
                    <div className={styles.fade} />
                  </div>
                </div>
              </ReflexElement>
              <ReflexSplitter style={splitterStyle} onResize={updateXarrow} />
              <ReflexElement
                flex={flexRatios["ingest.rules"]}
                name="ingest.rules"
                onStopResize={handleResize}
              >
                <Rules
                  rules={ingestRules}
                  onRulesChange={handleRulesChange}
                  setRules={setIngestRules}
                  setLoading={setLoading}
                />
              </ReflexElement>
              <ReflexSplitter style={splitterStyle} onResize={updateXarrow} />
              <ReflexElement
                flex={flexRatios["ingest.output"]}
                name="ingest.output"
                onStopResize={handleResize}
              >
                <div className={styles.row}>
                  <div className={styles.connectionContainer}>
                    {getConnectionArrows("assets")}
                    <div className={styles.fade} />
                  </div>
                  <Output assets={ingestAssets} />
                </div>
              </ReflexElement>
            </ReflexContainer>
          </Xwrapper>
        </div>
        <LinearProgress
          color="ignite"
          style={{
            width: "100%",
            marginTop: "10px",
            visibility: loading ? "visible" : "hidden",
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate} color="ignite" variant="outlined">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Ingest;

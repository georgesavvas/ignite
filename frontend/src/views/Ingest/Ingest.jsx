import styles from "./Ingest.module.css";
import Files from "./Files";
import Rules from "./Rules";
import Output from "./Output";
import Divider from '@mui/material/Divider';
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import { useEffect, useState } from 'react';
import debounce from 'lodash.debounce';
import clientRequest from "../../services/clientRequest";

const splitterStyle = {
  borderStyle: "solid",
  borderColor: "rgb(80,80,80)",
  backgroundColor: "rgb(80,80,80)",
  boxSizing: "border-box",
  marginLeft: "2.5%",
  marginRight: "2.5%"
}

const defaultFlexRations = {
  "ingest.files": 0.3,
  "ingest.rules": 0.4,
  "ingest.output": 0.3
}

const duplicate = (x, n) => Array.from(new Array(n), () => x);

function Ingest() {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [ingestDirs, setIngestDirs] = useState("");
  const [ingestFiles, setIngestFiles] = useState([]);
  const [ingestRules, setIngestRules] = useState([]);
  const [ingestAssets, setIngestAssets] = useState([]);

  useEffect(() => {
    const data = loadReflexLayout();
    if (!data) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const files = data["ingest.files"];
    const rules = data["ingest.rules"];
    const output = data["ingest.output"];
    if (!files || !rules || !output) {
      setFlexRatios(defaultFlexRations);
      return
    }
    const fullWidth = files[0] + rules[0] + output[0];
    const ratios = {
      "ingest.files": files[0] / fullWidth,
      "ingest.rules": rules[0] / fullWidth,
      "ingest.output": output[0] / fullWidth
    };
    setFlexRatios(ratios);
  }, [])

  useEffect(() => {
    getFiles();
    getOutput();
  }, [ingestDirs])

  const handleResize = data => {
    saveReflexLayout(data)
  }

  const ruleTemplate = {
    file_target: "*",
    file_target_type: "filename",
    rule_type: "extract_info",
    extract_target: "filename",
    set_target: "name",
    replace_target: "",
    rule_value: "{name}_{comp}_{}.{ext}"
  }

  const getFiles = debounce(() => {
    clientRequest("ingest_get_files", {"dirs": ingestDirs}).then(resp => setIngestFiles(resp.data.trimmed));
  }, 250)

  const getOutput = debounce(() => {
    const data = {
      dirs: ingestDirs,
      rules: ingestRules,
      dry: true
    }
    clientRequest("ingest", {data: data}).then(resp => {
      setIngestAssets(resp.data);
    });
  }, 250)

  const handleDirsChange = e => {
    const dirs =e.target.value;
    setIngestDirs(dirs);
  }

  const handleRulesChange = (e, action) => {
    switch (action) {
      case "add":
        setIngestRules(prevState => [...prevState, ruleTemplate]);
        break
      case "remove":
        setIngestRules(prevState => {
          prevState.pop();
          return [...prevState];
        })
        break
      case "modify":
        const [field, id] = e.target.name.split("-");
        const value = e.target.value;
        setIngestRules(prevState => {
          prevState[id][field] = value;
          return [...prevState];
        })
        break
    }
    getOutput();
  }

  return (
    <div className={styles.container}>
      <ReflexContainer orientation="vertical">
        <ReflexElement flex={flexRatios["ingest.files"]} name="ingest.files" onStopResize={handleResize}>
          <Files files={ingestFiles} onDirsChange={handleDirsChange} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["ingest.rules"]} name="ingest.rules" onStopResize={handleResize}>
          <Rules rules={ingestRules} onRulesChange={handleRulesChange} template={ruleTemplate} />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement flex={flexRatios["ingest.output"]} name="ingest.output" onStopResize={handleResize}>
          <Output assets={ingestAssets} />
        </ReflexElement>
      </ReflexContainer>
    </div>
  );
}

export default Ingest;

import styles from "./Ingest.module.css";
import Files from "./Files";
import Rules from "./Rules";
import Output from "./Output";
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
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
  // marginLeft: "5%"
}

const defaultFlexRations = {
  "ingest.files": 0.35,
  "ingest.rules": 0.3,
  "ingest.output": 0.35
}

const duplicate = (x, n) => Array.from(new Array(n), () => x);

const getFilesDebounced = debounce((data, callback) => {
  clientRequest("ingest_get_files", data).then(resp => {
    callback(resp);
  });
}, 250)

const getOutputDebounced = debounce((data, callback) => {
  clientRequest("ingest", data).then(resp => {
    callback(resp);
  });
}, 500)

function Ingest() {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [ingestDirs, setIngestDirs] = useState("");
  const [ingestFiles, setIngestFiles] = useState([]);
  const [ingestRules, setIngestRules] = useState([]);
  const [ingestAssets, setIngestAssets] = useState([]);
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const updateXarrow = useXarrow();

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
    setLoading(true);
    getFiles();
    getOutput();
  }, [ingestDirs])

  useEffect(() => {
    getOutput();
  }, [ingestRules])

  const handleResize = data => {
    saveReflexLayout(data)
  }

  const ruleTemplate = {
    file_target: "*",
    file_target_type: "filename",
    task: "",
    name: "",
    comp: "",
    rule: "",
    replace_target: "",
    replace_value: ""
  }

  const getFiles = () => getFilesDebounced(
      {"dirs": ingestDirs},
      resp => {
        setIngestFiles(resp.data.trimmed);
      }
  )

  const getOutput = () => {
    const data = {
      dirs: ingestDirs,
      rules: ingestRules,
      dry: true
    }
    getOutputDebounced(
    {data: data},
    resp => {
      setIngestAssets(resp.data.assets);
      setConnections(resp.data.connections);
      setLoading(false);
    }
  )}

  const handleDirsChange = e => {
    const dirs =e.target.value;
    setIngestDirs(dirs);
  }

  const handleRulesChange = (e, action, index=-1) => {
    setLoading(true);
    switch (action) {
      case "add":
        setIngestRules(prevState => [...prevState, ruleTemplate]);
        break
      case "remove":
        setIngestRules(prevState => {
          const rules = [...prevState];
          if (index < 0) rules.pop();
          else rules.splice(index, 1);
          return rules;
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
  }

  return (
    <div className={styles.container}>
      <Xwrapper>
        <ReflexContainer orientation="vertical">
          <ReflexElement flex={flexRatios["ingest.files"]} name="ingest.files" onStopResize={handleResize}>
            <div className={styles.row}>
              <Files files={ingestFiles} onDirsChange={handleDirsChange} />
              <div className={styles.connectionContainer}>
                {
                  !loading && connections && connections.rules_files ?
                  connections.rules_files.map(
                    (rule, index) => <Xarrow end={"file-" + rule[1]} start={"rule-" + rule[0]}
                      key={index} strokeWidth={2} curveness={0.5} color="rgb(100,100,100)"
                      showHead={true} animateDrawing={0.25} headShape="circle" headSize={3}
                      endAnchor={{position: "right", offset: {x: 40}}}
                      startAnchor={{position: "left", offset: {x: -25}}}
                    />
                  )
                  : null
                }
                <div className={styles.fade} />
              </div>
            </div>
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} onResize={updateXarrow} />
          <ReflexElement flex={flexRatios["ingest.rules"]} name="ingest.rules" onStopResize={handleResize}>
            <Rules rules={ingestRules} onRulesChange={handleRulesChange} template={ruleTemplate} />
          </ReflexElement>
          <ReflexSplitter style={splitterStyle} onResize={updateXarrow} />
          <ReflexElement flex={flexRatios["ingest.output"]} name="ingest.output" onStopResize={handleResize}>
            <div className={styles.row}>
              <div className={styles.connectionContainer}>
                {
                  !loading && connections && connections.rules_assets ?
                  connections.rules_assets.map(
                    (rule, index) => <Xarrow start={"rule-" + rule[0]} end={"asset-" + rule[1]}
                      key={index} strokeWidth={2} curveness={0.5} color="rgb(100,100,100)"
                      showHead={true} animateDrawing={0.25} headShape="circle" headSize={3}
                      startAnchor={{position: "right", offset: {x: 40}}}
                      endAnchor={{position: "left", offset: {x: -25}}}
                    />
                  )
                  : null
                }
                <div className={styles.fade} />
              </div>
              <Output assets={ingestAssets} />
            </div>
          </ReflexElement>
        </ReflexContainer>
      </Xwrapper>
      <div style={{width: "100%", marginTop: "10px", display: loading ? "inline" : "none"}}>
        <LinearProgress color="ignite" />
      </div>
    </div>
  );
}

export default Ingest;

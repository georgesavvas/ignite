import styles from "./Ingest.module.css";
import Files from "./Files";
import Rules from "./Rules";
import Output from "./Output";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Xarrow, { Xwrapper, useXarrow } from 'react-xarrows';
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import {ContextContext} from "../../contexts/ContextContext";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'
import { useEffect, useState, useContext } from 'react';
import debounce from 'lodash.debounce';
import clientRequest from "../../services/clientRequest";
import ClearIcon from '@mui/icons-material/Clear';

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

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function getRandomColour() {
  var h = rand(1, 36) * 10;
  var s = rand(30, 30);
  var l = rand(10, 10);
  return `hsl(${h},${s}%,${l}%)`;
}

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

const ingestDialogStyle = {
  "& .MuiDialog-container": {
    "& .MuiPaper-root": {
      width: "100%",
      maxWidth: "95vw",
      height: "100%",
      maxHeight: "90vh",
      backgroundColor: "rgb(20,20,20)",
      backgroundImage: "none"
    },
  },
}

function Ingest(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);
  const [ingestDirs, setIngestDirs] = useState("");
  const [ingestFiles, setIngestFiles] = useState([]);
  const [ingestRules, setIngestRules] = useState([{}]);
  const [ingestAssets, setIngestAssets] = useState([]);
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const updateXarrow = useXarrow();
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);

  const RULETEMPLATE = {
    file_target: "*",
    file_target_type: "filename",
    task: currentContext.path,
    name: "",
    comp: "",
    rule: "",
    replace_target: "",
    replace_value: ""
  }

  useEffect(() => {
    if (!props.open) return;
    
    setIngestDirs("");
    setIngestRules([{...RULETEMPLATE, colour: getRandomColour()}]);
    setIngestAssets([]);
  }, [props.open])

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
    if (!props.open) return;
    setLoading(true);
    getFiles();
    getOutput();
  }, [ingestDirs])

  useEffect(() => {
    if (!props.open) return;
    getOutput();
  }, [ingestRules])

  const handleResize = data => {
    saveReflexLayout(data)
  }

  const getFiles = () => {
    setLoading(true);
    getFilesDebounced(
      {"dirs": ingestDirs},
      resp => {
        setIngestFiles(resp.data.trimmed);
        setLoading(false);
      }
  )}

  const getOutput = () => {
    setLoading(true);
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

  const handleDirsChange = value => {
    setIngestDirs(value);
  }

  const handleRulesChange = (e, action, index=-1, index2=-1) => {
    // setLoading(true);
    switch (action) {
      case "add":
        setIngestRules(prevState => {
          const rule = {...RULETEMPLATE, colour: getRandomColour()};
          return [...prevState, rule]
        });
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
      case "swap":
        setIngestRules(prevState => {
          const rules = [...prevState];
          [rules[index], rules[index2]] = [rules[index2], rules[index]]
          return rules;
        })
        break
      case "move":
        setIngestRules(prevState => {
          const rules = [...prevState];
          const ruleToMove = rules.splice(index, 1)[0];
          rules.splice(index2, 0, ruleToMove);
          return rules;
        })
        break
    }
  }

  function handleCreate() {
    setLoading(true);
    const data = {
      dirs: ingestDirs,
      rules: ingestRules,
      dry: false
    }
    clientRequest("ingest", {data: data}).then(resp => {
      if (resp.ok) {
        props.enqueueSnackbar("Ingested!", {variant: "success"});
      } else {
        props.enqueueSnackbar("Ingest failed.", {variant: "error"});
      }
      setLoading(false);
      refreshContext();
      props.onClose();
    });
  }

  return (
    <Dialog open={props.open} onClose={props.onClose} sx={ingestDialogStyle}>
      <ClearIcon onClick={props.onClose} className={styles.closeButtonStyle} />
      <DialogContent style={{overflow: "hidden"}}>
        <div className={styles.container}>
          <Xwrapper>
            <ReflexContainer orientation="vertical">
              <ReflexElement flex={flexRatios["ingest.files"]} name="ingest.files" onStopResize={handleResize}>
                <div className={styles.row}>
                  <Files files={ingestFiles} onDirsChange={handleDirsChange} />
                  <div className={styles.connectionContainer}>
                    {
                      !loading && ingestRules && connections && connections.rules_files ?
                      connections.rules_files.map(
                        (rule, index) => <Xarrow end={"file-" + rule[1]} start={"rule-" + rule[0]}
                          key={index} strokeWidth={2} curveness={0.5} color={ingestRules[rule[0]].colour}
                          showHead={true} animateDrawing={0.25} headShape="circle" headSize={3}
                          endAnchor={{position: "right", offset: {x: 40}}}
                          startAnchor={{position: "left", offset: {x: 0}}}
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
                <Rules rules={ingestRules} onRulesChange={handleRulesChange} setRules={setIngestRules} setLoading={setLoading} />
              </ReflexElement>
              <ReflexSplitter style={splitterStyle} onResize={updateXarrow} />
              <ReflexElement flex={flexRatios["ingest.output"]} name="ingest.output" onStopResize={handleResize}>
                <div className={styles.row}>
                  <div className={styles.connectionContainer}>
                    {
                      !loading && connections && connections.rules_assets ?
                      connections.rules_assets.map(
                        (rule, index) => <Xarrow start={"rule-" + rule[0]} end={"asset-" + rule[1]}
                          key={index} strokeWidth={2} curveness={0.5} color={ingestRules[rule[0]].colour}
                          showHead={true} animateDrawing={0.25} headShape="circle" headSize={3}
                          startAnchor={{position: "right", offset: {x: 15}}}
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
        </div>
        <LinearProgress color="ignite" style={{width: "100%", marginTop: "10px", visibility: loading ? "visible" : "hidden"}} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCreate} color="ignite" variant="outlined">Create</Button>
      </DialogActions>
    </Dialog>
  );
}

export default Ingest;

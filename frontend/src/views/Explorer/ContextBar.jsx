import { Breadcrumbs } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, {useEffect, useState, useContext, useRef} from "react";
import TextField from '@mui/material/TextField';
import styles from "./ContextBar.module.css";
import { ContextContext } from "../../contexts/ContextContext";
import { CopyToClipboard } from "../ContextActions";
import { DIRECTORYICONS } from "../../constants";
import ContextBarLink from './ContextBarLink';

export default function ContextBar() {
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);
  const [contextPath, setContextPath] = useState("");
  const [contextPathError, setContextPathError] = useState([false, ""]);
  const [isTextField, setIsTextField] = useState(false);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const textfieldRef = useRef(null);

  useEffect(() => {
    if (currentContext.path !== undefined) {
      setContextPathError([false, ""]);
      setContextPath(currentContext.path || "");
    }
  },[currentContext]);

  const handlePathChange = e => {
    setCurrentContext(e.target.value).then((success => {
      if (!success) {
        setContextPathError([true, "Not found"]);
        enqueueSnackbar("Path not found", {variant: "error"});
      }
    }))
  }

  const handleBreadCrumbClick = e => {
    setIsTextField(true);
  }

  const handleBlur = e => {
    handlePathChange(e)
    setIsTextField(false);
  }

  const getSectionPaths = () => {
    if (!currentContext.posix) return {};
    let sectionPaths = {};
    const rootLength = currentContext.root.split("/").length;
    const sections = currentContext.posix.replace("/scenes/", "/").replace("/exports/", "/").split("/");
    sections.slice(rootLength).map((section, index) => {
      sectionPaths[section] = sections.slice(0, rootLength + index + 1).join("/")
    })
    return sectionPaths;
  }
  const sectionPaths = getSectionPaths();

  return (
    <div className={styles.container} onClick={handleBreadCrumbClick}>
      {isTextField ?
        <TextField
          id="outlined-basic"
          size="small"
          fullWidth={true}
          placeholder="Location"
          variant="outlined"
          error={contextPathError[0]}
          value={contextPath}
          onChange={e => setContextPath(e.target.value)}
          onKeyPress={e => e.key === "Enter" ? handleBlur(e) : null}
          onBlur={handleBlur}
          autoFocus
        />
        :
        <Breadcrumbs>
          {Object.keys(sectionPaths).map((section, index) => {
            const path = sectionPaths[section];
            const kind = currentContext.ancestor_kinds[path] || "directory";
            const Icon = DIRECTORYICONS[kind];
            return (
              <ContextBarLink setCurrentContext={setCurrentContext} icon={Icon} path={path} key={index}>{section}</ContextBarLink>
            )
          })}     
        </Breadcrumbs>
      }
    </div>
  )
}

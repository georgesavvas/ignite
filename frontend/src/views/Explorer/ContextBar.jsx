import { Breadcrumbs } from '@mui/material';
import { useSnackbar } from 'notistack';
import React, {useEffect, useState, useContext, useRef} from "react";
import styles from "./ContextBar.module.css";
import { ContextContext } from "../../contexts/ContextContext";
import { CopyToClipboard } from "../ContextActions";
import { DIRECTORYICONS } from "../../constants";
import ContextBarLink from './ContextBarLink';
import IgnTextField from '../../components/IgnTextField';
import IgnButton from "../../components/IgnButton";

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

  const handlePathChange = value => {
    setCurrentContext(value).then((success => {
      if (!success) {
        setContextPathError([true, "Not found"]);
        enqueueSnackbar("Path not found", {variant: "error"});
        setContextPath(currentContext.path);
      }
    }))
  }

  const handleBreadCrumbClick = e => {
    setIsTextField(true);
  }

  const handleBlur = e => {
    const value = e.target.value;
    console.log(currentContext.path, value);
    if (currentContext.path !== value) handlePathChange(value);
    setIsTextField(false);
  }

  const getSectionPaths = () => {
    if (!currentContext.posix) return {};
    let sectionPaths = {};
    const sections = currentContext.path_nr.replace("/scenes/", "/").replace("/exports/", "/").split("/");
    sections.map((section, index) => {
      sectionPaths[section] = sections.slice(0, index + 1).join("/")
    })
    return sectionPaths;
  }
  const sectionPaths = getSectionPaths();

  return (
    <div className={styles.container} onClick={handleBreadCrumbClick}>
      {isTextField ?
        <IgnTextField
          id="outlined-basic"
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

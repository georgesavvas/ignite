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

import Breadcrumbs from "@mui/material/Breadcrumbs";
import { ClickEvent } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";

import IgnTextField from "../../components/IgnTextField";
import { DIRECTORYICONS } from "../../constants";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import styles from "./ContextBar.module.css";
import ContextBarLink from "./ContextBarLink";

export const ContextBar = () => {
  const { currentContext, setCurrentContext } = useContext(ContextContext) as ContextContextType;
  const [contextPath, setContextPath] = useState("");
  const [isTextField, setIsTextField] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (currentContext.path !== undefined) {
      setContextPath(currentContext.path || "");
    }
  }, [currentContext]);

  const handlePathChange = (value: string) => {
    setCurrentContext(value).then((success) => {
      if (!success) {
        enqueueSnackbar("Path not found", { variant: "error" });
        setContextPath(currentContext.path);
      }
    });
  };

  const handleBreadCrumbClick = (e: ClickEvent) => {
    const { target } = e;
    if (!(target instanceof HTMLElement)) return;
    if (target.className.startsWith("MuiBackdrop")) return;
    setIsTextField(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    const { target } = e;
    if (!(target instanceof HTMLTextAreaElement)) return;
    const value = target.value;
    if (currentContext.path !== value) handlePathChange(value);
    setIsTextField(false);
  };

  const getSectionPaths = () => {
    if (!currentContext.posix) return {};
    let sectionPaths = {} as { [key: string]: string };
    const sections = currentContext.path_nr
      .replace("/scenes/", "/")
      .replace("/exports/", "/")
      .split("/");
    sections.map((section, index) => {
      sectionPaths[section] = sections.slice(0, index + 1).join("/");
    });
    return sectionPaths;
  };
  const sectionPaths = getSectionPaths();

  return (
    <div className={styles.container} onClick={handleBreadCrumbClick}>
      {isTextField ? (
        <IgnTextField
          id="outlined-basic"
          fullWidth
          placeholder="Location"
          variant="outlined"
          value={contextPath}
          onChange={(e) => setContextPath(e.target.value)}
          onKeyPress={(e) => (e.key === "Enter" ? handleBlur(e as React.FocusEvent) : null)}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <Breadcrumbs>
          {Object.keys(sectionPaths).map((section, index) => {
            const path = sectionPaths[section];
            const kind = currentContext.ancestor_kinds[path] || "directory";
            const Icon = DIRECTORYICONS[kind];
            return (
              <ContextBarLink
                setCurrentContext={setCurrentContext}
                icon={Icon}
                path={path}
                key={index}
                root={currentContext.root}
              >
                {section}
              </ContextBarLink>
            );
          })}
        </Breadcrumbs>
      )}
    </div>
  );
};

export default ContextBar;

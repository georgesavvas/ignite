import { useState, createContext, useContext, useEffect } from "react";
import {ContextContext} from "./ContextContext";
import serverRequest from "../services/serverRequest";

export const ProjectContext = createContext();

export const ProjectProvider = props => {
  const [selectedProject, setSelectedProject] = useState("test_project");
  const [currentContext, setCurrentContext] = useContext(ContextContext);

  useEffect(() => {
    if (selectedProject) {
      serverRequest("get_projects_root").then(resp => {
        const data = resp.data;
        setCurrentContext(data + "/" + selectedProject);
      })
    }
  }, [selectedProject])

  return (
    <ProjectContext.Provider value={[selectedProject, setSelectedProject]}>
      {props.children}
    </ProjectContext.Provider>
  );
}

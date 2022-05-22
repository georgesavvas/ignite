import { useState, createContext, useContext, useEffect } from "react";
import {ContextContext} from "./ContextContext";
import serverRequest from "../services/serverRequest";

export const ProjectContext = createContext();

export const ProjectProvider = props => {
  const [selectedProject, setSelectedProject] = useState("");
  const [currentContext, setCurrentContext, refreshContext] = useContext(ContextContext);

  // useEffect(() => {
  //   if (selectedProject) {
  //     serverRequest("get_projects_root").then(resp => {
  //       const data = resp.data;
  //       console.log("Setting context from project to", data)
  //       setCurrentContext(data + "/" + selectedProject);
  //     })
  //   }
  // }, [selectedProject])

  const handleProjectChange = project => {
    serverRequest("get_projects_root").then(resp => {
      const data = resp.data;
      console.log("Setting context from project to", data)
      setSelectedProject(project);
      setCurrentContext(data + "/" + project);
    })
  }

  return (
    <ProjectContext.Provider value={[selectedProject, handleProjectChange]}>
      {props.children}
    </ProjectContext.Provider>
  );
}

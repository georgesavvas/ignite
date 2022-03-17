import { useState, createContext } from "react";

export const ProjectContext = createContext();

export const ProjectProvider = props => {
  const [selectedProject, setSelectedProject] = useState("");
  return (
    <ProjectContext.Provider value={[selectedProject, setSelectedProject]}>
      {props.children}
    </ProjectContext.Provider>
  );
}

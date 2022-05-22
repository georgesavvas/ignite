const cOpts = {
  create_directory: {name: "create_dir", label: "Create directory", dir_kind: "directory"},
  create_build: {name: "create_build", label: "Create build", dir_kind: "build"},
  create_sequence: {name: "create_sequence", label: "Create sequence", dir_kind: "sequence"},
  create_shot: {name: "create_shot", label: "Create shot", dir_kind: "shot"},
  create_task: {name: "create_task", label: "Create task", dir_kind: "task"}
}

export const DIRCONTEXTOPTIONS = {
  "project": [],
  "task": [cOpts.create_task],
  "directory": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build, cOpts.create_task],
  "phase": [cOpts.create_directory, cOpts.create_sequence, cOpts.create_shot, cOpts.create_build],
  "build": [cOpts.create_directory, cOpts.create_task],
  "sequence": [cOpts.create_directory, cOpts.create_shot],
  "shot": [cOpts.create_directory, cOpts.create_task]
}

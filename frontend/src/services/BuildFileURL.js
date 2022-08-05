function BuildFileURL(filepath, config, options={}) {
  if (!filepath || filepath === undefined) return "";
  // console.log("BuildFileURL Input -", filepath);
  const address = config.serverDetails.address;
  const remote = config.access.remote;
  const serverProjectsDir = config.access.serverProjectsDir || "";
  let projectsDir = config.access.projectsDir || "";
  if (projectsDir.endsWith("/") || projectsDir.endsWith("\\")) {
    projectsDir = projectsDir.slice(0, -1)
  }

  let input = serverProjectsDir;
  let output = projectsDir;
  if (options.reverse) {
    input = projectsDir;
    output = serverProjectsDir;
  }

  const inputSlash = input.includes("/") ? "/" : "\\";
  const outputSlash = output.includes("/") ? "/" : "\\";
  input += inputSlash;
  output += outputSlash;

  let filepath_processed = filepath;

  // This is to allow processing of posix paths. It will convert them to windows paths
  // if needed.
  filepath_processed = filepath_processed.replaceAll(outputSlash, inputSlash);
  if (filepath_processed.startsWith(input)) {
    filepath_processed = filepath_processed.replace(input, "");
  }
  
  filepath_processed = filepath_processed.replaceAll(inputSlash, outputSlash);
  if (filepath_processed.startsWith(output)) {
    filepath_processed = filepath_processed.replace(output, "");
  }

  // console.log(input, output, inputSlash, outputSlash);
  // console.log(filepath, "->", `${output}${filepath_processed}`);

  if (options.pathOnly) {
    const value = `${output}${filepath_processed}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  } else if (remote || options.forceRemote) {
    const value = `${address}/files/${filepath_processed}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  } else {
    const value = `ign://${output}${filepath_processed}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  }
}

export default BuildFileURL;

function BuildFileURL(filepath, config, options={}) {
  if (!filepath || filepath === undefined) return "";
  // console.log("BuildFileURL Input -", filepath);
  const address = config.serverDetails.address;
  const remote = config.access.remote;

  let serverProjectsDir = config.access.serverProjectsDir || "";
  let projectsDir = config.access.projectsDir || "";

  let input = serverProjectsDir;
  let output = projectsDir;
  if (options.reverse) {
    input = projectsDir;
    output = serverProjectsDir;
  }
  const isWinPath = output.includes("\\");
  input = input.replaceAll("\\","/");
  output = output.replaceAll("\\","/");

  if (!input.endsWith("/")) input += "/";
  if (!output.endsWith("/")) output += "/";

  let unix_path = filepath.replaceAll("\\", "/");

  // This is to allow processing of posix paths. It will convert them to windows paths
  // if needed.
  if (unix_path.startsWith(input)) {
    unix_path = unix_path.replace(input, "");
  }
  if (unix_path.startsWith(output)) {
    unix_path = unix_path.replace(output, "");
  }

  // console.log(input, output);
  // console.log(filepath, "->", `${output}${filepath_processed}`);

  if (options.pathOnly) {
    const platform_path = isWinPath ? unix_path.replaceAll("/", "\\") : unix_path;
    const platform_output = isWinPath ? output.replaceAll("/", "\\") : output;
    const value = `${platform_output}${platform_path}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  } else if (remote || options.forceRemote) {
    const value = `http://${address}/files/${unix_path}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  } else {
    const value = `ign://${output}${unix_path}`;
    // console.log("BuildFileURL Output -", value);
    return value;
  }
}

export default BuildFileURL;

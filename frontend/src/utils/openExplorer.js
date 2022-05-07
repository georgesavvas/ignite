import clientRequest from "../services/clientRequest";

export default async function openExplorer(filepath, enqueueSnackbar) {
  const ok = await clientRequest("get_explorer_cmd", {"filepath": filepath}).then(resp => {
    const data = resp.data;
    return window.api.launch_dcc(data.cmd, data.args, data.env);
  });
  if (!ok) enqueueSnackbar("Couldn't launch explorer.", {variant: "error"});
}

import clientRequest from "../services/clientRequest";

export default function openExplorer(filepath, enqueueSnackbar) {
  clientRequest("show_in_explorer", {"filepath": filepath}).then((resp) => {
    if (!resp.ok) enqueueSnackbar("Couldn't open this item in explorer.", {variant: "error"});
  })
}

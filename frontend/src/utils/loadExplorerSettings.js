function loadExplorerSettings() {
  const data = localStorage.getItem("explorer_settings");
  return JSON.parse(data)
}

export default loadExplorerSettings;

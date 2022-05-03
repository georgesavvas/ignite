import loadExplorerSettings from "./loadExplorerSettings";

function saveExplorerSettings(data) {
  if (!data || data == null) return;
  const existing = loadExplorerSettings() || {tileSize: {}, viewType: {}};
  data.viewType = {...existing.viewType, ...data.viewType};
  ["dynamic", "assets", "scenes"].forEach(elem => {
    const existing_type = existing.tileSize[elem];
    const data_type = data.tileSize[elem];
    data.tileSize[elem] = {...existing_type, ...data_type};
  })
  localStorage.setItem("explorer_settings", JSON.stringify(data));
}

export default saveExplorerSettings;

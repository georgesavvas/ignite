import loadExplorerSettings from "./loadExplorerSettings";

const defaultSettings = {
  resultType: undefined,
  viewType: {dynamic: undefined, assets: undefined, scenes: undefined},
  tileSize: {dynamic: {
    grid: undefined, row: undefined
  }, assets: {
    grid: undefined, row: undefined
  }, scenes: {
    grid: undefined, row: undefined
  }}
};

function saveExplorerSettings(data) {
  if (!data || data == null) return;
  const existing = loadExplorerSettings() || defaultSettings;
  let newSettings = {}
  newSettings.resultType = data.resultType;
  newSettings.viewType = {...existing.viewType};
  newSettings.viewType[data.resultType] = data.viewType;
  newSettings.tileSize = {};
  ["dynamic", "assets", "scenes"].forEach(elem => {
    const existing_type = existing.tileSize[elem];
    newSettings.tileSize[elem] = {...existing_type};
  })
  newSettings.tileSize[data.resultType][data.viewType] = data.tileSize;
  localStorage.setItem("explorer_settings", JSON.stringify(newSettings));
  return newSettings;
}

export default saveExplorerSettings;

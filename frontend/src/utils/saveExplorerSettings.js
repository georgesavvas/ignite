function saveExplorerSettings(data) {
  if (!data || data == null) return;
  localStorage.setItem("explorer_settings", JSON.stringify(data));
}

export default saveExplorerSettings;

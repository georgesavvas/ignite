function loadReflexLayout() {
  const data = localStorage.getItem("reflex_layout");
  return JSON.parse(data)
}

export default loadReflexLayout

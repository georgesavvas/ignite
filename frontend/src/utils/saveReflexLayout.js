import loadReflexLayout from "./loadReflexLayout";

function saveReflexLayout({domElement, component}) {
  const existing = loadReflexLayout();
  const name = component.props.name;
  const data = { [name]: [domElement.offsetWidth, domElement.offsetHeight] }
  localStorage.setItem("reflex_layout", JSON.stringify({...existing, ...data}));
}

export default saveReflexLayout

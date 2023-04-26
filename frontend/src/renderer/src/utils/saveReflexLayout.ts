// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HandlerProps } from "react-reflex";

import loadReflexLayout from "./loadReflexLayout";

function saveReflexLayout({ domElement, component }: HandlerProps) {
  console.log("reflex domElement", domElement);
  const existing = loadReflexLayout();
  const name = component.props.name as string;
  const data = { [name]: [domElement.offsetWidth, domElement.offsetHeight] };
  localStorage.setItem("reflex_layout", JSON.stringify({ ...existing, ...data }));
}

export default saveReflexLayout;

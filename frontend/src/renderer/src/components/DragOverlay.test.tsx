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

import { render } from "@testing-library/react";

import DragOverlay, { DragOverlayProps } from "./DragOverlay";

const makeSut = (props: DragOverlayProps) => {
  return render(<DragOverlay {...props} />);
};

describe("DragOverlay", () => {
  it("Renders text", () => {
    const { getByText } = makeSut({
      text: "overlay_text",
    });
    expect(getByText(/overlay_text/)).toBeInTheDocument();
  });

  it("Renders error", () => {
    const { getByText } = makeSut({
      text: "overlay_text",
      error: "overlay_error",
    });
    expect(getByText(/overlay_error/)).toBeInTheDocument();
  });
});

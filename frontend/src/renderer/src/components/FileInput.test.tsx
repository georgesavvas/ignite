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

import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import { vi } from "vitest";

import { igniteTheme } from "../theme";
import FileInput, { FileInputProps } from "./FileInput";

const makeSut = (props: FileInputProps) => {
  return render(
    <ThemeProvider theme={igniteTheme}>
      <FileInput {...props} />
    </ThemeProvider>
  );
};

describe("FileInput", () => {
  it("renders correctly", () => {
    const { getByDisplayValue, getByText } = makeSut({
      label: "field_label",
      value: "path_placeholder",
      onChange: vi.fn(),
    });
    expect(getByDisplayValue(/path_placeholder/)).toBeInTheDocument();
    expect(getByText("...")).toBeInTheDocument();
  });
});

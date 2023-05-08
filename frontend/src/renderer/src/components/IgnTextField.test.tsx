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

import { TextFieldProps } from "@mui/material";
import { render } from "@testing-library/react";

import IgnTextField from "./IgnTextField";

const makeSut = (props: TextFieldProps) => {
  return render(<IgnTextField {...props} />);
};

describe("IgnTextField", () => {
  it("renders correctly", async () => {
    const { getByDisplayValue, getAllByText } = makeSut({
      label: "field_label",
      value: "field_value",
    });
    expect(getByDisplayValue(/field_value/)).toBeInTheDocument();
    expect(getAllByText(/field_label/)[0]).toBeInTheDocument();
  });
});

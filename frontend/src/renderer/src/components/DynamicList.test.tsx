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

import { Typography } from "@mui/material";
import { fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";

import DynamicList, { DynamicListProps } from "./DynamicList";

const makeSut = (props: Partial<DynamicListProps>) => {
  return render(
    <DynamicList {...props}>
      <Typography>alpha</Typography>
      <Typography>beta</Typography>
      <Typography>gamma</Typography>
    </DynamicList>
  );
};

describe("DynamicList", () => {
  it("Renders title/content", () => {
    const { getByText } = makeSut({ title: "list_title" });

    expect(getByText(/list_title/)).toBeInTheDocument();
    expect(getByText(/beta/)).toBeInTheDocument();
  });

  it("Add/Remove content", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();
    const { getByTestId } = makeSut({ onAdd: onAdd, onRemove: onRemove });

    fireEvent.click(getByTestId("list-btn-add"));
    expect(onAdd).toHaveBeenCalled();

    fireEvent.click(getByTestId("list-btn-remove"));
    expect(onRemove).toHaveBeenCalled();
  });
});

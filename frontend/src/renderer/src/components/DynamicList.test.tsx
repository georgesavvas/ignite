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
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import DynamicList from "./DynamicList";

describe("DynamicList", () => {
  it("Renders title", () => {
    render(<DynamicList title="hello" />);

    const title = screen.getByText("hello");

    expect(title).toBeInTheDocument();
  });

  it("Renders content", () => {
    render(
      <DynamicList>
        <Typography>one</Typography>
        <Typography>two</Typography>
        <Typography>three</Typography>
      </DynamicList>
    );

    const one = screen.getByText("one");
    const two = screen.getByText("two");
    const three = screen.getByText("three");

    expect(one).toBeInTheDocument();
    expect(two).toBeInTheDocument();
    expect(three).toBeInTheDocument();
  });

  it("Add/Remove content", () => {
    const onAdd = vi.fn();
    const onRemove = vi.fn();

    render(<DynamicList onAdd={onAdd} onRemove={onRemove} />);

    expect(onAdd.mock.calls.length).toBe(1);
    expect(onRemove.mock.calls.length).toBe(1);
  });
});

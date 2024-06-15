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

import "@testing-library/jest-dom";

import { ThemeProvider } from "@mui/material/styles";
import { render } from "@testing-library/react";
import { vi } from "vitest";

import { igniteTheme } from "../theme";
import CreateDirModal, { CreateDirModalProps } from "./CreateDirModal";

const makeSut = (props: CreateDirModalProps) => {
  return render(
    <ThemeProvider theme={igniteTheme}>
      <CreateDirModal {...props} />
    </ThemeProvider>,
  );
};

describe("CreateDirModal", () => {
  const onCreate = vi.fn();
  const onClose = vi.fn();
  const genericProps = { open: true, loading: false, onCreate: onCreate, onClose: onClose };

  it("Modal title", () => {
    const { getByText } = makeSut({
      data: { kind: "directory" },
      ...genericProps,
    });
    expect(getByText(/Create directory/)).toBeInTheDocument();
    // screen.debug();
  });

  // it("Check content: Directory", () => {
  //   const { getByText } = makeSut({
  //     meta: { dirKind: "directory", modalTitle: "modal_title" },
  //     ...genericProps
  //   });
  //   expect(getByText(/text/)).toBeInTheDocument();
  // });
});

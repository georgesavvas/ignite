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

import { Button } from "@mui/material";
import { render } from "@testing-library/react";
import { vi } from "vitest";

import Modal, { ModalProps } from "./Modal";

const makeSut = (props: ModalProps) => {
  return render(<Modal {...props} />);
};

describe("Modal", () => {
  it("renders correctly", async () => {
    const { getByText } = makeSut({
      open: true,
      onClose: vi.fn(),
      title: "modal_title",
      buttons: [<Button>first_button</Button>, <Button>second_button</Button>],
    });
    expect(getByText(/modal_title/)).toBeInTheDocument();
    expect(getByText(/first_button/)).toBeInTheDocument();
    expect(getByText(/second_button/)).toBeInTheDocument();
  });
});
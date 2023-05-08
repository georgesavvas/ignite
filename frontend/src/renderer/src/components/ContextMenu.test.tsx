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

import { fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";

import ContextMenu, { ContextMenuProps } from "./ContextMenu";

const makeSut = (props: ContextMenuProps) => {
  return render(<ContextMenu {...props} />);
};

describe("ContextMenu", () => {
  let contextMenu = {
    mouseX: 0,
    mouseY: 0,
    data: null,
  };
  const setContextMenu = vi.fn();
  const itemFn = vi.fn();
  const items = [
    {
      label: "item_label",
      divider: true,
      fn: itemFn,
    },
  ];

  it("Renders title/subtitle", () => {
    const { getByText } = makeSut({
      title: "menu_title",
      subtitle: "menu_subtitle",
      items: items,
      contextMenu: contextMenu,
      setContextMenu: setContextMenu,
    });
    expect(getByText(/menu_title/)).toBeInTheDocument();
    expect(getByText(/menu_subtitle/)).toBeInTheDocument();
  });

  it("Renders item", () => {
    const { getByText, getByRole } = makeSut({
      items: items,
      contextMenu: contextMenu,
      setContextMenu: setContextMenu,
    });
    expect(getByText(/item_label/)).toBeInTheDocument();
    expect(getByRole("menuitem").getAttribute("class")).toMatch(/MuiMenuItem-divider/);
  });

  it("Item functional", () => {
    const { getByRole } = makeSut({
      items: items,
      contextMenu: contextMenu,
      setContextMenu: setContextMenu,
    });
    fireEvent.click(getByRole("menuitem"));
    expect(itemFn).toHaveBeenCalledOnce();
  });
});

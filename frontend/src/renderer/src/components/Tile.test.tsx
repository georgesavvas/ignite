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

import { IgniteDirectory } from "@renderer/types/common";
import { render } from "@testing-library/react";
import { SnackbarProvider } from "notistack";

import { ConfigProvider } from "../contexts/ConfigContext";
import Tile, { TileProps } from "./Tile";

const makeSut = (props: TileProps) => {
  return render(
    <SnackbarProvider>
      <ConfigProvider>
        <Tile {...props} />
      </ConfigProvider>
    </SnackbarProvider>,
  );
};

const mockData = {
  anchor: "P:/plane_crash/build/.ign_group.yaml",
  attributes: [],
  context: "",
  creation_time: "3 months ago",
  creation_ts: 1675527603.919817,
  dir_kind: "group",
  group: "build",
  icon: "group",
  modification_time: "1 month ago",
  modification_ts: 1678552564.516013,
  name: "build",
  path: "P:/plane_crash/build",
  path_nr: "plane_crash/build",
  project: "plane_crash",
  protected: false,
  repr: "",
  thumbnail: undefined,
  size: "0.0 B",
  tags: [],
  uri: "ign:plane_crash:build",
} as IgniteDirectory;

describe("Tile", () => {
  it("renders correctly", async () => {
    const { getByTestId } = makeSut({
      entity: mockData,
    });
    expect(getByTestId(/tile-container/)).toBeInTheDocument();
    expect(getByTestId(/tile-hoverarea/)).toBeInTheDocument();
  });
});

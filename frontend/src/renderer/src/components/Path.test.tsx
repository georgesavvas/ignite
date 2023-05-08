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
import { SnackbarProvider } from "notistack";

import { ConfigProvider } from "../contexts/ConfigContext";
import { ContextProvider } from "../contexts/ContextContext";
import Path, { PathProps } from "./Path";

const makeSut = (props: PathProps) => {
  return render(
    <SnackbarProvider>
      <ConfigProvider>
        <ContextProvider>
          <Path {...props} />
        </ContextProvider>
      </ConfigProvider>
    </SnackbarProvider>
  );
};

describe("Path", () => {
  it("renders correctly", async () => {
    const { getByText } = makeSut({
      path: "/test/path/string",
    });
    expect(getByText("/test/path/string")).toBeInTheDocument();
  });
});

// Copyright 2022 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import Sockette from "sockette";

export function clientSocket(endpoint, config, sessionID, websocketConfig={}) {
  const address = config.clientAddress;
  const defaultWebsocketConfig = {
    // onopen: e => console.log(e),
    // onmessage: e => console.log(e),
    // onreconnect: e => console.log(e),
    // onmaximum: e => console.log(e),
    // onclose: e => console.log(e),
    // onerror: e => console.log(e)
  };
  const ws = new Sockette(
    `ws://${address}/api/v1/ws/${endpoint}/${sessionID}`,
    {...defaultWebsocketConfig, ...websocketConfig}
  );
  return ws;
}

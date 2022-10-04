// Copyright 2022 George Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


async function serverRequest(method, data=undefined) {
  const address = await window.services.get_env("IGNITE_SERVER_ADDRESS");
  console.log("Server request:", address, method, data);
  if (!address) {
    console.log("Invalid server address, aborting...");
    return;
  }
  return await request(address, method, data);
}

async function request(address, method, data, attempt=0) {
  try {
    const resp = await fetch(`http://${address}/api/v1/${method}`, {
      method: !data ? "GET" : "POST",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const resp2 = await resp.json();
    console.log("Server response:", method, resp2);
    return resp2;
  } catch (error) {
    console.log(error);
    if (attempt == 0) {
      await window.services.check_server();
      setTimeout(request, 4000, address, method, data, attempt += 1);
    }
    else if (attempt <= 2) {
      setTimeout(request, 2000, address, method, data, attempt += 1);
    } else return {ok: false, msg: "Could not connect to Ignite server..."};
  }
}

export default serverRequest;

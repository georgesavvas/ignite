import { createSocket, socketRequest } from "./clientWebSocket";

async function serverRequest(method, data=undefined) {
  const address = await window.services.get_env("IGNITE_SERVER_ADDRESS");
  // const WS = await createSocket();
  console.log("Server request:", address, method, data);
  // console.log(WS);
  if (!address) {
    console.log("Invalid server address, aborting...");
    return;
  }
  const resp = await fetch(`http://${address}/api/v1/${method}`, {
    method: !data ? "GET" : "POST",
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  const resp2 = await resp.json();
  console.log("Server response:", method, resp2);
  return resp2;
}

export default serverRequest;

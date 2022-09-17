import Sockette from "sockette";

export function clientSocket(endpoint, config, sessionID, websocketConfig={}) {
  const address = config.clientAddress;
  const defaultWebsocketConfig = {
    onopen: e => console.log(e),
    onmessage: e => console.log(e),
    onreconnect: e => console.log(e),
    onmaximum: e => console.log(e),
    onclose: e => console.log(e),
    onerror: e => console.log(e)
  };
  const ws = new Sockette(
    `ws://${address}/ws/${endpoint}/${sessionID}`,
    {...defaultWebsocketConfig, ...websocketConfig}
  );
  return ws;
}

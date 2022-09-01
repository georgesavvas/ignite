export function clientSocket(endpoint, config, sessionID) {
  const address = config.clientAddress;
  const ws = new WebSocket(`ws://${address}/ws/${endpoint}/${sessionID}`);
  return ws;
}

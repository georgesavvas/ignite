export function serverSocket(endpoint, config, sessionID) {
  const address = config.serverDetails.address;
  const ws = new WebSocket(`ws://${address}/ws/${endpoint}/${sessionID}`);
  return ws;
}

export async function createSocket() {
  const address = await window.services.get_env("IGNITE_SERVER_ADDRESS")
  const ws = new WebSocket(`ws://${address}/ws/main`);
  return ws;
}

export async function socketRequest(method, data=undefined) {
  const address = await window.services.get_env("IGNITE_SERVER_ADDRESS");
  const ws = new WebSocket(`ws://${address}/ws/main`);
  return ws;
}

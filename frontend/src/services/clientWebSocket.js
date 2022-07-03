function clientWebSocket(method, data=undefined) {
  const ws = new WebSocket(`ws://127.0.0.1:9091/ws/${method}`);
  return ws;
}

export default clientWebSocket;

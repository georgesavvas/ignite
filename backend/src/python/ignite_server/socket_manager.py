import logging


class SocketManager:
    def __init__(self):
        self.connections = []

    async def connect(self, websocket, session_id):
        for ws, id in self.connections:
            if session_id == id:
                logging.warning(f"Closing websocket {session_id}")
                await ws.close()
        await websocket.accept()
        self.connections.append((websocket, session_id))
        logging.info(f"Total connections: {len(self.connections)}")

    def disconnect(self, websocket, session_id):
        self.connections.remove((websocket, session_id))
        logging.info(f"Total connections: {len(self.connections)}")

    async def broadcast(self, data):
        for connection in self.connections:
            await connection[0].send_json(data)


manager = SocketManager()

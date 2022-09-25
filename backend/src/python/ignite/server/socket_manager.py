import logging

from ignite.utils import get_logger


LOGGER = get_logger(__name__)


class SocketManager:
    def __init__(self):
        self.connections = []

    async def connect(self, websocket, session_id):
        for i, (ws, id) in enumerate(self.connections):
            if session_id == id:
                LOGGER.warning(f"Closing websocket {session_id}")
                self.connections.pop(i)
                break
        await websocket.accept()
        self.connections.append((websocket, session_id))
        LOGGER.info(f"Total connections: {len(self.connections)}")

    def disconnect(self, websocket, session_id):
        self.connections.remove((websocket, session_id))
        LOGGER.info(f"Total connections: {len(self.connections)}")

    async def broadcast(self, data):
        for connection in self.connections:
            await connection[0].send_json(data)
    
    def get(self, session_id):
        for ws, id in self.connections:
            if session_id == id:
                return ws

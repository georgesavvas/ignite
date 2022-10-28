# Copyright 2022 George Savvas

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ignite.server import router as server_router
from ignite.client import router as client_router
from ignite.server.socket_manager import SocketManager
from ignite.server.utils import CONFIG
from ignite.utils import error, get_logger
from ignite.client.utils import CONFIG

LOGGER = get_logger(__name__)
SERVER_HOST = "0.0.0.0"
_, SERVER_PORT = CONFIG["server_details"].get("address", ":").split(":")
ENV = os.environ

ASSET_UPDATES_MANAGER = SocketManager()

app = FastAPI()
app.include_router(server_router.router)
app.include_router(client_router.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    LOGGER.info(f"Launching server at {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(
        f"{__name__}:app",
        host=SERVER_HOST,
        port=int(SERVER_PORT),
        # log_level="debug",
        workers=1
    )

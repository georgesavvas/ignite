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
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from platformdirs import user_data_dir

from ignite.server import router as server_router
from ignite.client import router as client_router
from ignite.server.socket_manager import SocketManager
from ignite.client.utils import CONFIG
from ignite.utils import get_logger, mount_root


LOGGER = get_logger(__name__)
SERVER_HOST = "0.0.0.0"
_, SERVER_PORT = CONFIG["server_details"].get("address", ":").split(":")
ENV = os.environ
ENV["IGNITE_ADDRESS"] = f"{SERVER_HOST}:{SERVER_PORT}"

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

path = Path.home() / ".ignite"
path.mkdir(parents=True, exist_ok=True)
port_file = path / "ignite.port"
pid_file = path / "ignite.pid"
if port_file.exists() or pid_file.exists():
    LOGGER.warning(f"Last shutdown was not clean")
port_file.write_text(SERVER_PORT)
pid_file.write_text(str(os.getpid()))

@app.on_event("startup")
def startup_event():
    mount_root(app, CONFIG)

@app.on_event("shutdown")
def shutdown_event():
    LOGGER.info(f"Cleaning up...")
    port_file.unlink()
    pid_file.unlink()

if __name__ == "__main__":
    LOGGER.info(f"Launching server at {SERVER_HOST}:{SERVER_PORT}")
    uvicorn.run(
        f"{__name__}:app",
        host=SERVER_HOST,
        port=int(SERVER_PORT),
        log_level="info",
        workers=1
    )

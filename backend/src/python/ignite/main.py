# Copyright 2022 Georgios Savvas

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

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from platformdirs import user_data_dir

from ignite.server import router as server_router
from ignite.client import router as client_router
from ignite.server.socket_manager import SocketManager
from ignite.client.utils import CONFIG
from ignite.utils import mount_root
from ignite.logger import get_logger, setup_logger, EndpointFilter


PID = str(os.getpid())
ENV = os.environ
LOGGER = get_logger(__name__)
SERVER_HOST = "0.0.0.0"
address = ENV.get("IGNITE_CLIENT_ADDRESS", "")
SERVER_PORT = address.split[":"][1] if ":" in address else "9070"

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
pid_file.write_text(PID)


@app.on_event("startup")
def startup_event():
    uvicorn_error_logger = logging.getLogger("uvicorn.error")
    uvicorn_access_logger = logging.getLogger("uvicorn.access")
    setup_logger(uvicorn_error_logger)
    setup_logger(uvicorn_access_logger)
    uvicorn_access_logger.addFilter(EndpointFilter(path="/api/v1/ping"))
    mount_root(app, CONFIG)


@app.on_event("shutdown")
def shutdown_event():
    LOGGER.info("Cleaning up...")
    if port_file.exists():
        port_file.unlink()
    else:
        LOGGER.warning(f"Port file {port_file} doesn't exist.")
    if pid_file.exists():
        pid_file.unlink()
    else:
        LOGGER.warning(f"PID file {pid_file} doesn't exist.")


@app.get("/api/v1/quit")
async def force_quit():
    LOGGER.info("Asked to quit, cya!")
    global server
    global loop
    server.should_exit = True
    server.force_exit = True
    await server.shutdown()


@app.get("/api/v1/ping")
async def ping():
    return {"ok": True}


import subprocess

if __name__ == "__main__":
    config = uvicorn.Config(f"{__name__}:app", host=SERVER_HOST, port=int(SERVER_PORT))
    server = uvicorn.Server(config=config)
    LOGGER.info(f"*** Launching server at {SERVER_HOST}:{SERVER_PORT}")
    LOGGER.info(f"PID {PID}")
    server.run()

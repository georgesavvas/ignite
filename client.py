import os
import math
from posixpath import dirname
import uvicorn
import yaml
from pprint import pprint
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ignite import utils, api


CONFIG_PATH = Path(Path.home(), ".ignite")
if not CONFIG_PATH.exists():
    CONFIG_PATH.mkdir()


app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/get_dcc_config")
async def get_dcc_config():
    filepath = CONFIG_PATH / "dcc_config.yaml"
    if not filepath.exists():
        return {"ok": False}
    with open(filepath, "r") as f:
        data = yaml.safe_load(f)
    return {
        "ok": True,
        "path": filepath,
        "data": data
    }


@app.post("/api/v1/set_dcc_config")
async def set_dcc_config(request: Request):
    result = await request.json()
    print("Received:")
    pprint(result)
    filepath = CONFIG_PATH / "dcc_config.yaml"
    with open(filepath, "w") as f:
        yaml.safe_dump(result.get("data", []), f)
    return {
        "ok": True,
        "path": filepath
    }


@app.post("/api/v1/launch_dcc")
async def launch_dcc(request: Request):
    result = await request.json()
    return {
        "ok": True
    }


@app.post("/api/v1/get_env")
async def get_env(request: Request):
    result = await request.json()
    return {
        "ok": True
    }


if __name__ == "__main__":
    uvicorn.run("client:app", host="127.0.0.1", port=9091, log_level="info", reload=True)

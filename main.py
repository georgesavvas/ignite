import os
from posixpath import dirname
import uvicorn
from pprint import pprint
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ignite import utils, api


CONFIG = utils.get_config()


app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/get_projects")
async def get_projects():
    data = api.get_project_names()
    return {"data": data}


@app.post("/api/v1/get_project_tree")
async def get_project_tree(request: Request):
    result = await request.json()
    project = api.get_project(result.get("project"))
    data = project.get_project_tree() if project else {}
    return {"data": data}


@app.post("/api/v1/create_dir")
async def create_dir(request: Request):
    result = await request.json()
    path = result.get("path")
    method = result.get("method")
    dir_name = result.get("dir_name")
    if not path or not method or not dir_name:
        print("something missing")
        return {"success": False}
    entity = api.find(path)
    if not hasattr(entity, method):
        print(entity, "has no method", method)
        return {"success": False}
    getattr(entity, method)(dir_name)
    print(entity, method, dir_name)
    return {"success": True}


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=5000, log_level="info", reload=True)

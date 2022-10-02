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


import math
import os

from fastapi import APIRouter, Request

from ..utils import get_logger, log_request
from . import api

ENV = os.environ
LOGGER = get_logger(__name__)

VAULT_ROOT = ""


router = APIRouter(
    prefix="/vault",
    tags=["vault"]
)


@router.get("/get_root")
async def get_root():
    return {
        "ok": True,
        "data": VAULT_ROOT
    }


@router.post("/get_asset")
async def get_asset(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    data = api.get_asset(query)
    return {
        "ok": True,
        "data": data
    }


@router.post("/get_assets")
async def get_assets(request: Request):
    result = await request.json()
    log_request(result)
    query = result.get("query", {})
    # print("result:", result)
    data = api.get_assets(**query)
    limit = result.get("limit", 20)
    total = len(data)
    print("Results:", total)
    if not total:
        return {"ok": True, "data": [], "pages": {"total": 1}}
    pages = int(math.ceil(total / limit))
    page = result.get("page", 1)
    start = (page - 1) * limit
    end = start + limit
    # print(f"Total {total}, Limit: {limit}, Pages: {pages}")
    # print(f"Page: {page}, Start: {start}, End: {end}")
    to_return = data[start:end]
    return {
        "ok": True,
        "data": to_return,
        "pages": {
            "total": pages,
            "results": total
        }
    }


@router.post("/get_collections")
async def get_collections(request: Request):
    result = await request.json()
    log_request(result)
    user = result.get("user")
    data = api.get_collections(user, "all")
    return {
        "ok": True,
        "data": data
    }


@router.post("/create_collection")
async def create_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.create_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/delete_collection")
async def delete_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.delete_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/reorder_collection")
async def reorder_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data")
    ok = api.reorder_collection(data)
    return {"ok": ok}


@router.post("/get_component_info")
async def get_component_info(request: Request):
    result = await request.json()
    log_request(result)
    comp_path = result.get("comp_path")
    if not comp_path:
        return {"ok": False}
    data = api.get_component_info(comp_path)
    return {
        "ok": True,
        "data": data
    }


@router.post("/rename_collection")
async def rename_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.rename_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/edit_collection")
async def edit_collection(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.edit_collection(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/write_collections")
async def write_collections(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.write_collections(data)
    return {
        "ok": True,
        "data": data
    }


@router.get("/get_rule_templates")
async def get_rule_templates():
    data = api.get_rule_templates()
    return {
        "ok": True,
        "data": data
    }


@router.post("/add_rule_template")
async def add_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    data = result.get("data")
    if not name or not data:
        LOGGER.error(f"name {name} data {data}")
        return {"ok": False}
    data = api.add_rule_template(data, name)
    return {
        "ok": True,
        "data": data
    }


@router.post("/remove_rule_template")
async def remove_rule_template(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.remove_rule_template(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/delete_asset")
async def delete_asset(request: Request):
    result = await request.json()
    log_request(result)
    asset_id = result.get("data")
    data = api.delete_asset(asset_id)
    return {
        "ok": True,
        "data": data
    }


@router.get("/get_filter_templates")
async def get_filters():
    data = api.get_filter_templates()
    return {
        "ok": True,
        "data": data
    }


@router.post("/add_filter_template")
async def add_filter(request: Request):
    result = await request.json()
    log_request(result)
    name = result.get("name")
    data = result.get("data", {})
    if not name or not data:
        return {"ok": False}
    data = api.add_filter_template(data, name)
    return {
        "ok": True,
        "data": data
    }


@router.post("/remove_filter_template")
async def remove_filter(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    data = api.remove_filter_template(data)
    return {
        "ok": True,
        "data": data
    }


@router.post("/ingest_get_files")
async def ingest_get_files(request: Request):
    result = await request.json()
    log_request(result)
    dirs = result.get("dirs", "")
    resp = api.ingest_get_files(dirs)
    return {
        "ok": True,
        "data": resp
    }


@router.post("/ingest")
async def ingest(request: Request):
    result = await request.json()
    log_request(result)
    data = result.get("data", {})
    resp = api.ingest(data)
    return {
        "ok": True,
        "data": resp
    }

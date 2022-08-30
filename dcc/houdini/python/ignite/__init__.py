import os
import logging
import requests
from fnmatch import fnmatch


ENV = os.environ


PRESETS = {
    "*": {
        "karma": {
            "picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "camera": "/cameras/camMain"
        },
        "ifd": {
            "vm_picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "vm_tmpsharedstorage": r"$CACHE/ifds/storage/${VS}",
            "camera": "/obj/camMain"
        },
        "geometry": {
            "sopoutput": r"${EXPORTS}/${OS}/${VS}/main.$F4.bgeo.sc"
        },
        "comp": {
            "copoutput": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr"
        },
        "opengl": {
            "camera": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr"
        },
        "dop": {
            "dopoutput": r"$CACHE/sim/${VS}/$OS.$SF.sim"
        }
    }
}


def apply_presets(kwargs):
    node_type = kwargs["type"].name()
    category = kwargs["type"].category().typeName()

    node = kwargs["node"]
    node_path = node.path()
    node_parms = [p.name() for p in node.parms()]

    for p_cat, node_types in PRESETS.items():
        if not fnmatch(category, p_cat):
            continue
        for ndt, parms in node_types.items():
            if ndt != node_type:
                continue
            for parm_name, value in parms.items():
                if parm_name in node_parms:
                    logging.info(f"Setting {node_path}/{parm_name} to {value}")
                    node.parm(parm_name).set(value)


def ignite_request(server, method, data):
    address = ENV["IGNITE_SERVER_ADDRESS"]
    if server == "client":
        address = ENV["IGNITE_CLIENT_ADDRESS"]
    url = "http://{}/api/{}/{}".format(
        address,
        ENV["IGNITE_API_VERSION"],
        method
    )
    if data:
        return requests.post(url, json=data, timeout=5).json()
    else:
        return requests.get(url)


def server_request(method, data=None):
    return ignite_request("server", method, data)


def client_request(method, data=None):
    return ignite_request("client", method, data)

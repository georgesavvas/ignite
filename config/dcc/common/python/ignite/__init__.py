import os
import json
# import requests
from urllib import request


ENV = os.environ

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
        req =  request.Request(url, data=json.dumps(data).encode("utf-8"))
        req.add_header("Content-Type", "application/json; charset=utf-8")
        resp = request.urlopen(req, timeout=5)
        return json.loads(resp.read().decode("utf-8"))
        # resp = requests.post(url, json=data, timeout=5)
        # return resp.json() if resp else {"ok": False}
    else:
        req =  request.Request(url)
        resp = request.urlopen(req, timeout=5)
        return json.loads(resp.read().decode("utf-8"))
        # resp = requests.get(url)
        # return resp.json() if resp else {"ok": False}


def server_request(method, data=None):
    return ignite_request("server", method, data)


def client_request(method, data=None):
    return ignite_request("client", method, data)


def update_env_version(s, i):
    ENV["VS"] = s
    ENV["VERSION"] = s
    ENV["VSN"] = i

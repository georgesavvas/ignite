import logging
import os
from pathlib import PurePath
from pprint import pprint

ENV = os.environ


class LogFormatter(logging.Formatter):

    grey = "\x1b[38;21m"
    yellow = "\x1b[33;21m"
    red = "\x1b[31;21m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format = "%(asctime)s - %(name)-s - %(levelname)-6s - %(funcName)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format + reset,
        logging.INFO: grey + format + reset,
        logging.WARNING: yellow + format + reset,
        logging.ERROR: red + format + reset,
        logging.CRITICAL: bold_red + format + reset,
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt, datefmt="%d/%m/%Y %H:%M:%S")
        return formatter.format(record)


def get_logger(name):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    ch.setFormatter(LogFormatter())
    logger.handlers = []
    logger.addHandler(ch)
    logger.propagate = False
    return logger


LOGGER = get_logger(__name__)


def log_request(request):
    print("Request data:")
    pprint(request)


def process_request(req):
    # remap paths if needed
    # client_root = req.get("client_root")
    # if client_root:
    #     if req.get("path"):
    #         req["path"] = remap_path(req["path"], client_root)
    return req


def error(s, msg=""):
    LOGGER.error(s)
    return {"ok": False, "error": msg or s}


def build_path(path, server_root):
    path = PurePath(path)
    root = server_root.as_posix()
    if path.as_posix().startswith(root):
        return path
    else:
        return server_root / path


def remap_path(path, server_root, client_root):
    path = PurePath(path)
    client_root = PurePath(client_root)
    if server_root == client_root:
        return str(path)
    rel = path.relative_to(client_root)
    return server_root / rel


def bytes_to_human_readable(size, suffix="B"):
    for unit in ["", "K", "M", "G", "T", "P"]:
        if abs(size) < 1024.0:
            return f"{size:3.1f} {unit}{suffix}"
        size /= 1024.0
    return f"{size:.1f}Yi{suffix}"

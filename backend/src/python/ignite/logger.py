
import os
import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path


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
    logger.setLevel(logging.INFO)
    ch = logging.StreamHandler()
    ch.setFormatter(LogFormatter())
    logger.handlers = []
    logger.addHandler(ch)

    path = Path.home() / ".ignite/logs/ignite.log"
    path.parent.mkdir(exist_ok=True, parents=True)
    handler = TimedRotatingFileHandler(
        path, when="h", interval=1, backupCount=20
    )
    formatter = logging.Formatter(
        "%(asctime)s - %(levelname)-8s - %(funcName)s: %(message)s",
        datefmt="%d/%m/%Y %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

    logger.propagate = False
    return logger

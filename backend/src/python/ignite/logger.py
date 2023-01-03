
import os
import logging
from logging.handlers import TimedRotatingFileHandler
from pathlib import Path


ENV = os.environ


class EndpointFilter(logging.Filter):
    def __init__(self, path, *args, **kwargs,):
        super().__init__(*args, **kwargs)
        self._path = path

    def filter(self, record: logging.LogRecord):
        return record.getMessage().find(self._path) == -1


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


path = Path.home() / ".ignite/logs/ignite.log"
path.parent.mkdir(exist_ok=True, parents=True)
file_handler = TimedRotatingFileHandler(
    path, when="h", interval=1, backupCount=20
)
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)-8s - %(name)s - %(funcName)s: %(message)s",
    datefmt="%d/%m/%Y %H:%M:%S"
)
file_handler.setFormatter(formatter)


console_handler = logging.StreamHandler()
console_handler.setFormatter(LogFormatter())


def setup_logger(logger):
    logger.handlers = []
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)


def get_logger(name):
    logger = logging.getLogger(name)
    logger.handlers = []
    logger.setLevel(logging.INFO)

    setup_logger(logger)

    logger.propagate = False
    return logger

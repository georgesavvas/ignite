import logging
import sys

log_format = logging.Formatter("%(levelname)s:%(name)s:%(message)s")
log = logging.getLogger(__name__)
h = logging.StreamHandler(sys.stdout)
h.setFormatter(log_format)
log.addHandler(h)

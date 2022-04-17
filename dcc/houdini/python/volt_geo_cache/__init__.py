from __future__ import absolute_import, division, unicode_literals, print_function
import sys
import logging


log_format = logging.Formatter("%(levelname)s:%(name)s:%(message)s")
log = logging.getLogger(__name__)
log.handlers = []
h = logging.StreamHandler(sys.stdout)
h.setFormatter(log_format)
log.addHandler(h)

log.info("Init.")

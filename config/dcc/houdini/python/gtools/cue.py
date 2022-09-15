from __future__ import absolute_import, division, unicode_literals, print_function

import opencue as oc
import logging


logging.getLogger('googleapicliet.discovery_cache').setLevel(logging.ERROR)


def get_cpu_time(layer):
    runtime = 0
    for frame in layer.getFrames():
        start_time = frame.startTime()
        stop_time = frame.stopTime()
        if not start_time or not stop_time:
            continue
        cores = float(frame.resource().split("/")[1])
        runtime += (stop_time - start_time) * cores

    return runtime

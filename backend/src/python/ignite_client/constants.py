GENERIC_ENV = {
    "PROJECTS_ROOT": "{projects_root}",
    "OCIO": "{dcc}/ocio/aces_1.2/config.ocio"
}


DCC_ENVS = {
    "houdini": {
        "IGNITE_DCC": "{dcc}/houdini",
        "PYTHONPATH": "{dcc}/houdini/python;&",
        "HOUDINI_PATH": "{dcc}/houdini;&",
        "HOUDINI_MENU_PATH": "{dcc}/houdini;&",
        "HOUDINI_OTLSCAN_PATH": "&;{dcc}/houdini/otls",
        "PXR_PLUGINPATH_NAME": "{dcc}/houdini/dso/resources/"
    }
}


DCC_LOCATIONS = {
    "houdini": ""
}

OS_NAMES = {
    "Windows": "win",
    "Darwin": "mac",
    "Linux": "linux"
}

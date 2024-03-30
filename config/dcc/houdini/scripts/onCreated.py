import logging
from fnmatch import fnmatch


PRESETS = {
    "*": {
        "karma": {
            "f1": r"$FSTART",
            "f2": r"$FEND",
            "picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "camera": "/cameras/camMain",
        },
        "ifd": {
            "f1": r"$FSTART",
            "f2": r"$FEND",
            "vm_picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "vm_tmpsharedstorage": r"$CACHE/ifds/storage/${VS}",
            "camera": "/obj/camMain",
        },
        "geometry": {"sopoutput": r"${EXPORTS}/${OS}/${VS}/main.$F4.bgeo.sc"},
        "comp": {"copoutput": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr"},
        "opengl": {
            "f1": r"$FSTART",
            "f2": r"$FEND",
            "camera": "/obj/camMain",
            "picture": r"${EXPORTS}/${OS}/${VS}/main_acescg.$F4.exr",
            "bgimage": '`chs("../../camMain/vm_background")`',
        },
        "dop": {"dopoutput": r"$CACHE/sim/${VS}/$OS.$SF.sim"},
        "reference": {
            "primpath": "/root",
            "primkind": "assembly",
            "reftype": "payload",
            "handlemissingfiles": "ignore",
        },
        "filecache": {
            "basedir": r"$EXPORTS",
            "versionstr": 'v`padzero(3, ch("version"))`',
            "cachename": 'main`chs("framestr")``chs("filetype")`',
        },
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


apply_presets(kwargs)

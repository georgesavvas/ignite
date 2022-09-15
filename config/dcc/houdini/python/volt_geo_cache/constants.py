PATH_TEMPLATES = {
    "cache": "$CACHE/fxcache/{name}/{version}/",
    "exports_1.0": "$EXPORTS/fxcache/{wa}_{vs}.{name}/",
    "exports_2.0": "$EXPORTS/fxcache/{wa}.{name}_{vs}/",
}

FILENAME_TEMPLATES = {
    "cache": {
        "bgeo": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.bgeo.sc",
        "abc": "`chs(\"cache_name\")`{wedging}.abc",
        "vdb": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.vdb",
        "ass": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.ass",
        "usd": "`chs(\"cache_name\")`{wedging}.usd",
        "fbx": "`chs(\"cache_name\")`{wedging}.fbx",
    },
    "exports": {
        "bgeo": "fxcache.`chs(\"frame\")`.bgeo.sc",
        "abc": "fxcache.abc",
        "vdb": "fxcache.`chs(\"frame\")`.vdb",
        "ass": "fxcache.`chs(\"frame\")`.ass",
        "usd": "fxcache.usd",
        "fbx": "fxcache.fbx",
    },
}

CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS", "external": "$EXTERNAL"}

CACHE_MODES = {0: "cache", 1: "exports"}

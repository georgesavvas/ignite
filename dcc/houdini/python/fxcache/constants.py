CUSTOM_EXPORT_TEMPLATE = "/jobs/{silo}/{project}/work/{phase}/{asset}/{task}/{wa}/{wav}/{mode}"

PATH_TEMPLATES = {
    "cache": "{export_dir}/fxcache/{name}/{version}/",
    "exports_1.0": "{export_dir}/fxcache/{wa}_{vs}.{name}/",
    "exports_2.0": "{export_dir}/fxcache/{wa}.{name}_{vs}/",
}

FILENAME_TEMPLATES = {
    "cache": {
        "bgeo": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.bgeo.sc",
        "abc": "`chs(\"cache_name\")`{wedging}.abc",
        "vdb": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.vdb",
        "ass": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.ass",
        "usdc": "`chs(\"cache_name\")`{wedging}.usdc",
        "usdc seq": "`chs(\"cache_name\")`{wedging}.`chs(\"frame\")`.usdc",
        "fbx": "`chs(\"cache_name\")`{wedging}.fbx",
    },
    "exports": {
        "bgeo": "fxcache.`chs(\"frame\")`.bgeo.sc",
        "abc": "fxcache.abc",
        "vdb": "fxcache.`chs(\"frame\")`.vdb",
        "ass": "fxcache.`chs(\"frame\")`.ass",
        "usdc": "fxcache.usdc",
        "usdc seq": "fxcache.`chs(\"frame\")`.usdc",
        "fbx": "fxcache.fbx",
    },
}

CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS", "external": "$EXTERNAL"}

CACHE_MODES = {0: "cache", 1: "exports"}

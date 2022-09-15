CUSTOM_EXPORT_TEMPLATE = "/jobs/{silo}/{project}/work/{phase}/{asset}/{task}/{wa}/{wav}/{mode}"

PATH_TEMPLATES = {
    "cache": "{export_dir}/fxcache/{name}/{version}/",
    "exports_1.0": "{export_dir}/fxcache/{wa}_{vs}.{name}/",
    "exports_2.0": "{export_dir}/fxcache/{name}_{vs}/",
}

CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS", "external": "$EXTERNAL"}

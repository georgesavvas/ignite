CUSTOM_EXPORT_TEMPLATE = (
    "/jobs/{silo}/{project}/work/{phase}/{asset}/{task}/{wa}/{wav}/{mode}"
)

CACHE_DIR_VARS = {"cache": "$CACHE", "exports": "$EXPORTS", "external": "$EXTERNAL"}

CACHE_MODES = {0: "cache", 1: "exports"}

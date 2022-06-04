// IMPORT THIRD-PARTY LIBRARIES
#include <pxr/usd/ar/defaultResolver.h>
#include <pxr/usd/ar/defineResolver.h>

// IMPORT LOCAL LIBRARIES
#include "ignResolver.h"

PXR_NAMESPACE_OPEN_SCOPE

AR_DEFINE_RESOLVER(IgniteResolver, ArResolver)


IgniteResolver::IgniteResolver() : ArDefaultResolver() {}

IgniteResolver::~IgniteResolver() = default;

bool IgniteResolver::IsRelativePath(const std::string& path) {
    return false;
}

std::string IgniteResolver::Resolve(const std::string& path) {
    if (path == "/foo") {
        return "/bar";
    }

    return "";
}

PXR_NAMESPACE_CLOSE_SCOPE
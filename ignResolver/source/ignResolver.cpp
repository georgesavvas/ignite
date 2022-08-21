#define CURL_STATICLIB
#include <iostream>
#include <string>
#include <cstdlib>

#include "pxr/pxr.h"
#include "pxr/usd/ar/defineResolver.h"
#include "pxr/usd/ar/assetInfo.h"
#include "pxr/usd/ar/resolverContext.h"
#include <pxr/base/tf/fileUtils.h>
#include <pxr/base/tf/stringUtils.h>
#include <pxr/base/tf/pathUtils.h>
#include <pxr/base/tf/stringUtils.h>
#include <pxr/base/tf/diagnostic.h>
#include <pxr/base/vt/value.h>

//  #include "pxr/base/arch/fileSystem.h"
//  #include "pxr/base/arch/systemInfo.h"
//  #include "pxr/base/tf/getenv.h"
//  #include "pxr/base/tf/fileUtils.h"
//  #include "pxr/base/tf/pathUtils.h"
//  #include "pxr/base/tf/staticData.h"
//  #include "pxr/base/tf/stringUtils.h"
//  #include "pxr/base/vt/value.h"

//  #include "tbb/concurrent_hash_map.h"

#include "ignResolver.h"

#include <curl/curl.h>

#pragma comment (lib, "Normaliz.lib")
#pragma comment (lib, "Ws2_32.lib")
#pragma comment (lib, "Wldap32.lib")
#pragma comment (lib, "advapi32.lib")


int is_uri(const std::string uri) {
   if (uri.rfind("ign:", 0) == 0) {
       return 1;
   }
   return 0;
}

static size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
   ((std::string*)userp)->append((char*)contents, size * nmemb);
   return size * nmemb;
}

std::string resolve_uri(const std::string uri) {
    // std::cout << "Attempting to resolve " + uri + "\n";

    CURL *curl;
    CURLcode res;
    struct curl_slist *headers = NULL;

    headers = curl_slist_append(headers, "Accept: application/json");
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "charset: utf-8");

    
    char* address_var = std::getenv("IGNITE_SERVER_ADDRESS");
    std::string address = address_var ? address_var : "";
    address = std::string("http://") + address + "/api/v1/resolve";
    std::string data = "{\"uri\":\"" + uri + "\"}";
    std::string readBuffer = "";
    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, address.c_str());
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, data.length());
        curl_easy_setopt(curl, CURLOPT_POST, 1);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
        res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);
    }

    // std::cout << "Resolved to " + readBuffer + "\n\n";
    return readBuffer;

}

PXR_NAMESPACE_OPEN_SCOPE

AR_DEFINE_RESOLVER(IgniteResolver, ArResolver);


IgniteResolver::IgniteResolver() {
}

IgniteResolver::~IgniteResolver() {
}

ArResolvedPath
IgniteResolver::_Resolve(const std::string& assetURI) const {
    ArResolvedPath resolvedPath = _ResolveForNewAsset(assetURI);

    return TfPathExists(resolvedPath) ? resolvedPath : ArResolvedPath();
}

ArResolvedPath
IgniteResolver::_ResolveForNewAsset(const std::string& assetURI) const {
    std::cout << "_ResolveForNewAsset input " + assetURI << std::endl;
    if (assetURI.empty()) {
        std::cout << "_ResolveForNewAsset reject empty " + assetURI << std::endl;
        return ArResolvedPath();
    }

    if (!is_uri(assetURI)) {
        std::cout << "_ResolveForNewAsset reject not uri " + assetURI << std::endl;
        return ArResolvedPath();
    }

    std::string resolvedPath = resolve_uri(assetURI);

    std::cout << "_ResolveForNewAsset output " + resolvedPath << std::endl;

    return ArResolvedPath(resolvedPath);
}

// std::shared_ptr<ArAsset>
// IgniteResolver::_OpenAsset(const ArResolvedPath& resolvedPath) const {
//     return ArFilesystemAsset::Open(resolvedPath);
// }

// std::shared_ptr<ArWritableAsset>
// IgniteResolver::_OpenAssetForWrite(
//     const ArResolvedPath& resolvedPath,
//     WriteMode writeMode) const
// {
//     return ArFilesystemWritableAsset::Create(
//         _ResolveForNewAsset(resolvedPath), writeMode);
// }

PXR_NAMESPACE_CLOSE_SCOPE

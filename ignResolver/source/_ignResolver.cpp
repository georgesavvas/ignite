#include <iostream>
#include <string>
#include <cstdlib>
//#include <curl/curl.h>

#include "pxr/pxr.h"
#include "pxr/usd/ar/defineResolver.h"
#include "pxr/usd/ar/assetInfo.h"
#include "pxr/usd/ar/resolverContext.h"

#include "pxr/base/arch/fileSystem.h"
#include "pxr/base/arch/systemInfo.h"
#include "pxr/base/tf/getenv.h"
#include "pxr/base/tf/fileUtils.h"
#include "pxr/base/tf/pathUtils.h"
#include "pxr/base/tf/staticData.h"
#include "pxr/base/tf/stringUtils.h"
#include "pxr/base/vt/value.h"

#include "tbb/concurrent_hash_map.h"

#include "ignResolver.h"


int is_vri(const std::string vri) {
   if (vri.rfind("ign:", 0) == 0) {
       return 1;
   }
   return 0;
}

static size_t WriteCallback(void *contents, size_t size, size_t nmemb, void *userp)
{
   ((std::string*)userp)->append((char*)contents, size * nmemb);
   return size * nmemb;
}

std::string get_vri(const std::string vri) {
   std::cout << "Attempting to resolve " + vri + "\n";
   return "hello";
   //CURL *curl;
   //CURLcode res;
   //struct curl_slist *headers = NULL;

   //headers = curl_slist_append(headers, "Accept: application/json");
   //headers = curl_slist_append(headers, "Content-Type: application/json");
   //headers = curl_slist_append(headers, "charset: utf-8");

   //std::string host = std::getenv("IGNITE_SERVER_HOST");
   //    std::string port = std::getenv("IGNITE_SERVER_PORT");
   //std::string data = "{\"vri\":\"" + vri + "\"}";
   //std::string readBuffer = "";
   //curl = curl_easy_init();
   //if(curl) {
   //    curl_easy_setopt(curl, CURLOPT_URL, "http://" + host + ":" + port + "/api/v1/resolve");
   //    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
   //    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data.c_str());
   //    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, data.length());
   //    curl_easy_setopt(curl, CURLOPT_POST, 1);
   //    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
   //    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
   //    res = curl_easy_perform(curl);
   //    curl_easy_cleanup(curl);

   //    std::cout << "Resolved to " + readBuffer + "\n\n";
   //}

   //return readBuffer;

}

PXR_NAMESPACE_OPEN_SCOPE

AR_DEFINE_RESOLVER(IgniteResolver, ArResolver);


IgniteResolver::IgniteResolver() : ArDefaultResolver() {
    std::cout << "Creating Ignite USD Resolver\n";
}

IgniteResolver::~IgniteResolver() {
    std::cout << "Removing Ignite USD Resolver\n";
}

std::string
IgniteResolver::Resolve(const std::string& path) {
    if (is_vri(path)) {
        return get_vri(path);
    }

    return "Something is indeed off";
    
    return ArDefaultResolver::Resolve(path);

}

std::string
IgniteResolver::ResolveWithAssetInfo(const std::string& path, ArAssetInfo* assetInfo) {
    if (is_vri(path)) {
        return get_vri(path);
    }

    return ArDefaultResolver::ResolveWithAssetInfo(path, assetInfo);

}

PXR_NAMESPACE_CLOSE_SCOPE

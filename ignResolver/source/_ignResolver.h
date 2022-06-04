#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "pxr/pxr.h"
#include "pxr/usd/ar/api.h"
#include "pxr/usd/ar/resolver.h"
#include "pxr/usd/ar/defaultResolver.h"

#include <tbb/enumerable_thread_specific.h>


PXR_NAMESPACE_OPEN_SCOPE

class IgniteResolver : public ArDefaultResolver {
public:
    IgniteResolver();
    virtual ~IgniteResolver();

    virtual std::string Resolve(const std::string& path) override;

    virtual std::string ResolveWithAssetInfo(
        const std::string& path,
        ArAssetInfo* assetInfo) override;

    // AR_API
    //     virtual std::string GetExtension(const std::string& path) override;
    // AR_API
    //     virtual std::string Resolve(const std::string& path) override;

    // AR_API
    //     virtual std::string ResolveWithAssetInfo(
    //         const std::string& path, 
    //         ArAssetInfo* assetInfo) override;
    // AR_API
    //     virtual void UpdateAssetInfo(
    //        const std::string& identifier,
    //        const std::string& filePath,
    //        const std::string& fileVersion,
    //        ArAssetInfo* assetInfo) override;
    // AR_API
    //     virtual VtValue GetModificationTimestamp(
    //         const std::string& path,
    //         const std::string& resolvedPath) override;
    // AR_API
    //     virtual bool FetchToLocalResolvedPath(
    //         const std::string& path,
    //         const std::string& resolvedPath) override;
};

PXR_NAMESPACE_CLOSE_SCOPE
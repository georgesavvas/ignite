#include <iostream>
#include <memory>
#include <string>
#include <vector>

// #include "pxr/pxr.h"
// #include "pxr/usd/ar/api.h"
// #include "pxr/usd/ar/resolver.h"
#include "pxr/usd/ar/defaultResolver.h"

//  #include <tbb/enumerable_thread_specific.h>


PXR_NAMESPACE_OPEN_SCOPE

class IgniteResolver : public ArDefaultResolver {
public:
    IgniteResolver();
    virtual ~IgniteResolver();

    // virtual std::string Resolve(const std::string& path) override;

    // virtual std::string ResolveWithAssetInfo(
    //     const std::string& path,
    //     ArAssetInfo* assetInfo) override;

protected:
    std::string _CreateIdentifier(
        const std::string& assetPath,
        const ArResolvedPath& anchorAssetPath) const override;

    std::string _CreateIdentifierForNewAsset(
        const std::string& assetPath,
        const ArResolvedPath& anchorAssetPath) const override;

    ArResolvedPath _Resolve(
        const std::string& assetURI) const override;

    ArResolvedPath _ResolveForNewAsset(
        const std::string& assetURI) const override;

    // std::shared_ptr<ArAsset> _OpenAsset(
    //     const ArResolvedPath& resolvedPath) const override;

    // std::shared_ptr<ArWritableAsset>
    // _OpenAssetForWrite(
    //     const ArResolvedPath& resolvedPath,
    //     WriteMode writeMode) const override;
};

PXR_NAMESPACE_CLOSE_SCOPE
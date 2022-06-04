if (EXISTS "$ENV{USD_INSTALL_ROOT}")
    set(USD_INSTALL_ROOT $ENV{USD_INSTALL_ROOT})
endif ()

find_path(USD_INCLUDE_DIR pxr/pxr.h
          PATHS ${USD_INSTALL_ROOT}/include
          DOC "USD Include directory")

find_path(USD_LIBRARY_DIR libHUSD.lib
          PATHS $ENV{HOUDINI_ROOT}/custom/houdini/dsolib
          DOC "USD Libraries directory")
message($ENV{HOUDINI_ROOT}/custom/houdini/dsolib)
find_file(USD_GENSCHEMA
          names usdGenSchema
          PATHS $ENV{HOUDINI_ROOT}/bin
          DOC "USD Gen schema application")

if(USD_INCLUDE_DIR AND EXISTS "${USD_INCLUDE_DIR}/pxr/pxr.h")
    foreach(_usd_comp MAJOR MINOR PATCH)
        file(STRINGS
             "${USD_INCLUDE_DIR}/pxr/pxr.h"
             _usd_tmp
             REGEX "#define PXR_${_usd_comp}_VERSION .*$")
        string(REGEX MATCHALL "[0-9]+" USD_${_usd_comp}_VERSION ${_usd_tmp})
    endforeach()
    set(USD_VERSION ${USD_MAJOR_VERSION}.${USD_MINOR_VERSION}.${USD_PATCH_VERSION})
endif()

include(FindPackageHandleStandardArgs)

find_package_handle_standard_args(
    USD
    REQUIRED_VARS
    USD_INCLUDE_DIR
    USD_LIBRARY_DIR
    USD_GENSCHEMA
    VERSION_VAR
    USD_VERSION
)

cmake_minimum_required(VERSION "3.7.1")

project(ignResolver)

add_library(ignResolver SHARED
    source/ignResolver.h
    source/ignResolver.cpp
)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_GENERATOR_PLATFORM x64)
set(CMAKE_BUILD_TYPE Release)

add_definitions(-DCURL_STATICLIB)

target_compile_options(ignResolver PUBLIC -Zc:inline-)

if( MSVC )
    set_target_properties(ignResolver PROPERTIES LINK_FLAGS "/NODEFAULTLIB:hboost_python39-vc142-mt-x64-1_72.lib" )
endif()

target_include_directories(ignResolver PRIVATE .)
include_directories(
    source/windows/include
    $ENV{USD_ROOT}/include
    $ENV{USD_ROOT}/include/boost
    $ENV{PYTHON_ROOT}/include
)

target_link_directories(ignResolver PUBLIC
    source/windows/lib
    $ENV{PYTHON_ROOT}/lib
    $ENV{USD_ROOT}/lib
    $ENV{USD_ROOT}/bin
    $ENV{HOUDINI_ROOT}/custom/houdini/dsolib
    )
target_link_libraries(ignResolver
    $ENV{PYTHON_ROOT}/libs/python39.lib
    hboost_python39-mt-x64.lib
    libpxr_ar.lib
    libpxr_arch.lib
    libpxr_pxOsd.lib
    libpxr_sdf.lib
    libpxr_usd.lib
    libpxr_vt.lib
    libpxr_tf.lib
    libpxr_hd.lib
    libpxr_hdx.lib
    libcurl.lib
)

install(TARGETS ignResolver DESTINATION dso)
# install(FILES IgniteResolver.h DESTINATION include)
install(FILES plugInfo.json DESTINATION resources)
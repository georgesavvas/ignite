cmake_minimum_required( VERSION 3.6 )

project( IgniteResolver )

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

list(INSERT CMAKE_MODULE_PATH 0 "${CMAKE_SOURCE_DIR}/cmake")
set(CMAKE_INSTALL_PREFIX "./install" CACHE PATH "..." FORCE)

list ( APPEND CMAKE_PREFIX_PATH "C:/Program Files/Side Effects Software/Houdini 19.0.587/toolkit/cmake" )
find_package( Houdini REQUIRED )

find_package(USD REQUIRED)

add_subdirectory(source)

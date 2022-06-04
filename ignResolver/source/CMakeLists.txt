set(PLUGIN_NAME ignResolver)

link_directories(${USD_LIBRARY_DIR})

set(
    SRC
        ignResolver.cpp
        ignResolver.h
)

add_library(${PLUGIN_NAME}
    SHARED
        ${SRC}
)

target_link_libraries(${PLUGIN_NAME}
    PUBLIC
                "C:/Program Files/Side Effects Software/Houdini 19.0.587/python37/libs/python37.lib"
                # "C:/Program Files/Side Effects Software/Houdini 19.0.587/custom/houdini/dsolib/hboost_python37-mt-x64.lib"
                # "C:/Program Files/Side Effects Software/Houdini 19.0.587/custom/houdini/dsolib/libpxr_ar.lib"
)

target_include_directories(
        ${PLUGIN_NAME}
                SYSTEM
                        # PRIVATE
                        #         ${USD_INCLUDE_DIR}

                        PUBLIC
                                "C:/Program Files/Side Effects Software/Houdini 19.0.587/python37/include"
                                "${PROJECT_SOURCE_DIR}/include"
)

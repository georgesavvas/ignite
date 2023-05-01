// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Typography } from "@mui/material";
import { DataGrid, GridCellParams, GridRowParams } from "@mui/x-data-grid";
import {
  ClickEvent,
  IgniteAssetVersion,
  IgniteDirectory,
  IgniteEntity,
  IgniteScene,
} from "@renderer/types/common";
import { useContext, useMemo, useState } from "react";
import { useEffect } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import URI from "../../components/URI";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import AssetTile from "./AssetTile";
import DirectoryTile from "./DirectoryTile";

type RowEntity = IgniteAssetVersion | IgniteDirectory | IgniteScene;

interface RowViewProps {
  data: RowEntity[];
  selectedEntityPath: string;
  resultType: "dynamic" | "tasks" | "assets" | "scenes";
  onContextMenu: () => void;
  handleContextMenuSelection: () => void;
  tileSize: number;
  onSelected: (entity: RowEntity) => void;
  page: number;
  pageSize: number;
}

const RowView = (props: RowViewProps) => {
  const { setCurrentContext } = useContext(ContextContext) as ContextContextType;
  const [selectionModel, setSelectionModel] = useState<number[]>([]);

  useEffect(() => {
    const selectedIndex = props.data.findIndex(
      (entity) => entity.path === props.selectedEntityPath
    );
    setSelectionModel(selectedIndex > -1 ? [selectedIndex] : []);
  }, [props.data]);

  const renderEntity = (params: GridCellParams) => {
    const entity = params.value as RowEntity;
    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", entity.uri);
      e.dataTransfer.setData("ignite/kind", entity.dir_kind);
      e.dataTransfer.setData("ignite/path", entity.path);
      e.dataTransfer.setData("ignite/uri", entity.uri);
    };
    switch (entity.dir_kind) {
      default:
        return useMemo(
          () => (
            <DirectoryTile
              onContextMenu={props.onContextMenu}
              handleContextMenuSelection={props.handleContextMenuSelection}
              entity={entity}
              noInfo
              noBorder
              noOverlay
              draggable={true}
              onDragStart={handleDragStart}
            />
          ),
          [params.value]
        );
      case "assetversion":
        return useMemo(
          () => (
            <AssetTile
              onContextMenu={props.onContextMenu}
              handleContextMenuSelection={props.handleContextMenuSelection}
              entity={entity}
              noInfo
              noBorder
              noOverlay
              draggable={true}
              onDragStart={handleDragStart}
            />
          ),
          [params.value]
        );
    }
  };

  const renderUri = (params: GridCellParams) => {
    return <URI uri={params.value as string} style={{ pointerEvents: "none" }} />;
  };

  const renderText = (params: GridCellParams) => {
    return <Typography>{params.value as string}</Typography>;
  };

  const specificColumns = {
    dynamic: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.1,
        renderCell: renderText,
      },
      {
        index: 2,
        field: "version",
        headerName: "Version",
        flex: 0.1,
        renderCell: renderText,
      },
      {
        index: 3,
        field: "dir_kind",
        headerName: "Dir Kind",
        flex: 0.1,
        renderCell: renderText,
      },
      {
        index: 4,
        field: "dcc",
        headerName: "DCC",
        flex: 0.1,
        renderCell: renderText,
      },
    ],
    assets: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.25,
        renderCell: renderText,
      },
      {
        index: 2,
        field: "version",
        headerName: "Version",
        flex: 0.08,
        renderCell: renderText,
      },
      {
        index: 3,
        field: "uri",
        headerName: "URI",
        flex: 0.4,
        renderCell: renderUri,
        sortComparator: (r1: IgniteEntity, r2: IgniteEntity) => r1.uri < r2.uri,
      },
      {
        index: 4,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText,
      },
    ],
    tasks: [
      {
        index: 1,
        field: "name",
        headerName: "Name",
        flex: 0.1,
        renderCell: renderText,
      },
      {
        index: 2,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText,
      },
    ],
    scenes: [
      {
        index: 1,
        field: "version",
        headerName: "Version",
        flex: 0.08,
        renderCell: renderText,
      },
      {
        index: 2,
        field: "dcc",
        headerName: "DCC",
        flex: 0.1,
        renderCell: renderText,
      },
      {
        index: 3,
        field: "context",
        headerName: "Context",
        flex: 0.2,
        renderCell: renderText,
      },
    ],
  };

  const addSpecificColumns = (columns: any[]) => {
    const toAdd = specificColumns[props.resultType as keyof typeof specificColumns];
    if (!toAdd) return columns;
    toAdd.forEach((columnData) => {
      columns.splice(columnData.index, 0, columnData);
    });
    return columns;
  };

  const columns = [
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      minWidth: props.tileSize * 16,
      maxWidth: props.tileSize * 16,
      renderCell: renderEntity,
      sortComparator: (r1: IgniteEntity, r2: IgniteEntity) => r1.name < r2.name,
      cellClassName: () => "thumbnailColumn",
    },
    {
      field: "modificationTime",
      headerName: "Modified",
      flex: 0.11,
      renderCell: renderText,
    },
  ];

  const getRows = () => {
    return props.data.map((entity, index) => {
      return {
        id: index,
        thumbnail: entity,
        name: entity.name,
        dir_kind: entity.dir_kind,
        dcc: entity.dcc,
        version: entity.version,
        uri: entity.uri,
        context: entity.context,
        creationTime: entity.creation_time,
        modificationTime: entity.modification_time,
      };
    });
  };

  const handleRowClick = (params: GridRowParams, e: ClickEvent) => {
    if (e.detail === 2) {
      var path = params.row.thumbnail.path;
      if (params.row.thumbnail.task) {
        path = params.row.thumbnail.task.path;
      }
      setCurrentContext(path);
    }
    props.onSelected(params.row.thumbnail);
  };

  const handleRowContextMenu = (e: ClickEvent) => {
    // Bit ugly but upon right click on any point on a row, it finds the
    // thumbnail element and triggers onContextMenu()
    e.preventDefault();
    const row = e.target.dataset.field
      ? e.target.parentElement
      : e.target.parentElement.parentElement;
    const tile = row.firstChild.firstChild;
    for (const key in tile) {
      if (key.startsWith("__reactProps$")) {
        if (tile[key].onContextMenu) tile[key].onContextMenu(e);
      }
    }
  };

  return (
    <div style={{ height: "100%" }} onContextMenu={props.onContextMenu}>
      <DataGrid
        onRowClick={handleRowClick}
        componentsProps={{
          row: {
            onContextMenu: handleRowContextMenu,
          },
        }}
        page={props.page - 1}
        pageSize={props.pageSize}
        rows={getRows()}
        sx={{
          border: "none",
          "& .MuiDataGrid-virtualScrollerRenderZone": {
            marginTop: "1px!important",
          },
          "& .MuiDataGrid-row": {
            boxSizing: "border-box",
            cursor: "pointer",
          },
          "& .MuiDataGrid-row.Mui-selected": {
            outline: "1px solid rgb(252, 140, 3)",
            background: "rgb(40, 40, 40)",
          },
          // "& .MuiDataGrid-cell": {
          //   borderLeft: "1px solid rgb(30, 30, 30)"
          // },
          "& .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .thumbnailColumn": {
            padding: "1px 0px",
          },
        }}
        rowHeight={props.tileSize * 9}
        // getRowHeight={() => "auto"}
        columnHeaderHeight={0}
        hideFooter
        selectionModel={selectionModel}
        onSelectionModelChange={setSelectionModel}
        columns={addSpecificColumns(columns)}
        components={{
          NoRowsOverlay: () => <DataPlaceholder text="No data" />,
        }}
        options={{
          customHeadRender: () => null,
        }}
      />
    </div>
  );
};

export default RowView;

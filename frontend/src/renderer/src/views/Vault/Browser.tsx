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

import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { IgniteAssetVersion, InputChangeEvent } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";

import DataPlaceholder from "../../components/DataPlaceholder";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import { DeleteDir, RenameDir, VaultExport } from "../ContextActions";
import PageBar from "../Explorer/PageBar";
import AssetTile from "./AssetTile";
import styles from "./Browser.module.css";
import FilterBar from "./FilterBar";
import { ExpressionType } from "./FilterBuilder";
import TopBar from "./TopBar";
import { PagesType } from "./Vault";

const defaultExplorerSettings = {
  currentTileSize: 5,
  tilesPerPage: 50,
  currentViewType: "dynamic",
};

type ModalDataType = {
  deleteOpen?: boolean;
  renameOpen?: boolean;
  vaultExportOpen?: boolean;
};

interface BrowserProps {
  loadedData: IgniteAssetVersion[];
  selectedEntity?: IgniteAssetVersion;
  onRefresh: () => void;
  handleEntitySelected: (entity: IgniteAssetVersion) => void;
  onFilterChange: (data: any) => void;
  setTilesPerPage: (number: number) => void;
  handleQueryChange: (query: any) => void;
  pages: { total: number; results: number };
  setPages: React.Dispatch<React.SetStateAction<PagesType>>;
  isLoading: boolean;
  selectedCollection: string;
  query: any;
}

const Browser = (props: BrowserProps) => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [explorerSettings] = useState(defaultExplorerSettings);
  const [tileSize, setTileSize] = useState(200);
  const [tiles, setTiles] = useState<JSX.Element[]>([]);
  const { config } = useContext(ConfigContext) as ConfigContextType;
  const [modalData, setModalData] = useState<ModalDataType>({});
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!props.loadedData) return;
    setTiles(
      props.loadedData.map((entity) => {
        if (props.selectedEntity && entity.path === props.selectedEntity.path) {
          props.handleEntitySelected(entity);
        }
        entity.path = BuildFileURL(entity.path, config, { pathOnly: true });
        if (entity.components) {
          entity.components.forEach((comp) => {
            comp.path = BuildFileURL(comp.path, config, { pathOnly: true });
          });
        }
        return (
          <AssetTile
            key={entity.path}
            entity={entity}
            onSelected={props.handleEntitySelected}
            selected={props.selectedEntity && props.selectedEntity.path === entity.path}
            refreshContext={props.onRefresh}
            handleContextMenuSelection={handleContextMenuSelection}
          />
        );
      })
    );
  }, [
    props.loadedData,
    props.selectedEntity?.path,
    explorerSettings.currentViewType,
    explorerSettings.currentTileSize,
  ]);

  const handleContextMenuSelection = (action: string, _data: any) => {
    const data = { ..._data };
    data[`${action}Open`] = true;
    setModalData(data);
  };

  const handleFilterChange = (data: ExpressionType) => {
    props.onFilterChange(data);
  };

  const handlePageChange = (_: any, value: number) => {
    props.setPages((prev: PagesType) => ({ ...prev, current: value }));
  };

  const handleTilesPerPageChange = (e: InputChangeEvent) => {
    props.setTilesPerPage(parseInt(e.target.value) || 50);
  };

  const handleTileSizeChange = (value: number) => {
    setTileSize(value * 40);
  };

  const tileContainerStyle = {
    flexGrow: 1,
    display: "grid",
    overflowY: "auto",
    gridTemplateColumns: `repeat(auto-fill, minmax(${tileSize}px, 1fr))`,
    gridGap: "5px",
    padding: "5px",
    paddingTop: "5px",
  } as React.CSSProperties;

  const handleFilterStringChange = (value: string) => {
    props.handleQueryChange({ filter_string: value });
  };

  const getBrowserHelperText = () => {
    let s = `${props.pages.results} results | `;
    s += props.query.sort ? `Sorted by: ${props.query.sort.label}` : "";
    s += ` | Collection: ${props.selectedCollection}`;
    return s;
  };

  return (
    <div className={styles.container}>
      <DeleteDir
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, deleteOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <RenameDir
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prev) => ({ ...prev, renameOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
      />
      <VaultExport
        open={modalData.vaultExportOpen}
        onClose={() => setModalData((prev) => ({ ...prev, vaultExportOpen: false }))}
        data={modalData}
        fn={props.onRefresh}
        enqueueSnackbar={enqueueSnackbar}
      />
      <TopBar
        onRefresh={props.onRefresh}
        setQuery={props.handleQueryChange}
        onFilterStringChange={handleFilterStringChange}
        onFiltersToggle={() => setFiltersOpen((prevState) => !prevState)}
        enqueueSnackbar={enqueueSnackbar}
      />
      <Divider />
      <LinearProgress
        color="ignite"
        style={{
          width: "100%",
          minHeight: "4px",
          visibility: props.isLoading ? "visible" : "hidden",
        }}
      />
      <div className={styles.browserContainer}>
        <div style={{ width: "100%" }}>
          <FilterBar
            open={filtersOpen}
            setOpen={setFiltersOpen}
            onFilterChange={handleFilterChange}
          />
          <div className={styles.helperTextContainer}>
            <Typography variant="caption" style={{ color: "grey" }}>
              {getBrowserHelperText()}
            </Typography>
          </div>
          {props.loadedData && props.loadedData.length ? (
            <div className={styles.tileContainer} style={tileContainerStyle}>
              {Object.values(tiles)}
            </div>
          ) : (
            <DataPlaceholder text={props.isLoading ? "Please wait..." : "No results"} />
          )}
          <div className={styles.layoutHelper} />
        </div>
      </div>
      <Divider />
      <PageBar
        pages={props.pages?.total}
        onChange={handlePageChange}
        tileSize={explorerSettings.currentTileSize}
        tilesPerPage={explorerSettings.tilesPerPage}
        onTilesPerPageChange={handleTilesPerPageChange}
        onTileSizeChange={(_, value) => handleTileSizeChange(value as number)}
      />
    </div>
  );
};

export default Browser;

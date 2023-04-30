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

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SortIcon from "@mui/icons-material/Sort";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { ClickEvent, EnqueueSnackbar } from "@renderer/types/common";
import { useContext, useEffect, useState } from "react";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import FilterField from "../../components/FilterField";
import IgnButton from "../../components/IgnButton";
import { VaultContext, VaultContextType } from "../../contexts/VaultContext";
import NewAsset from "../Explorer/NewAsset";
import Ingest from "../Ingest/Ingest";

const style = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0px 5px",
  alignItems: "center",
  gap: "5px",
};

const iconButtonStyle = { height: "34.25px", width: "34.25px" };

interface TopBarProps {
  setQuery: (query: any) => void;
  onFilterStringChange: (value: string) => void;
  enqueueSnackbar: EnqueueSnackbar;
  onFiltersToggle: () => void;
  onRefresh: () => void;
}

const TopBar = (props: TopBarProps) => {
  const [sortMenu, setSortMenu] = useState<ContextMenuType | null>(null);
  const [filterValue, setFilterValue] = useState("");
  const [ingestOpen, setIngestOpen] = useState(false);
  const [newAssetOpen, setNewAssetOpen] = useState(false);
  const { vaultContext } = useContext(VaultContext) as VaultContextType;

  useEffect(() => {
    const sortData = localStorage.getItem("sortData");
    if (!sortData) return;
    props.setQuery({ sort: JSON.parse(sortData) });
  }, []);

  useEffect(() => {
    props.onFilterStringChange(filterValue);
  }, [filterValue]);

  const handleSortClicked = (e: ClickEvent) => {
    handleContextMenu(e, sortMenu, setSortMenu);
  };

  const handleSortChange = (field: string, reverse: boolean, label: string) => {
    const sortData = { field: field, reverse: reverse, label: label };
    props.setQuery({ sort: sortData });
    localStorage.setItem("sortData", JSON.stringify(sortData));
  };

  const sortOptions = [
    {
      label: "Name (A-Z)",
      fn: () => handleSortChange("name", false, "Name (A-Z)"),
    },
    {
      label: "Name (Z-A)",
      fn: () => handleSortChange("name", true, "Name (Z-A)"),
    },
    {
      label: "Date created (Newest first)",
      fn: () => handleSortChange("date_created", true, "Date created (Newest first)"),
    },
    {
      label: "Date created (Oldest first)",
      fn: () => handleSortChange("date_created", false, "Date created (Oldest first)"),
    },
    {
      label: "Date modified (Newest first)",
      fn: () => handleSortChange("date_modified", true, "Date modified (Newest first)"),
    },
    {
      label: "Date modified (Oldest first)",
      fn: () => handleSortChange("date_modified", false, "Date modified (Oldest first)"),
    },
  ];

  return (
    <div style={style}>
      <ContextMenu
        items={sortOptions}
        contextMenu={sortMenu}
        setContextMenu={setSortMenu}
        title="Sort By"
      />
      <Ingest
        open={ingestOpen}
        onClose={() => setIngestOpen(false)}
        enqueueSnackbar={props.enqueueSnackbar}
        path={vaultContext.path}
      />
      <NewAsset
        open={newAssetOpen}
        onClose={() => setNewAssetOpen(false)}
        enqueueSnackbar={props.enqueueSnackbar}
        path={vaultContext.path}
      />
      <IgnButton
        style={{ minWidth: "80px" }}
        color="ignite"
        variant="outlined"
        onClick={() => setIngestOpen(true)}
      >
        Ingest
      </IgnButton>
      <IgnButton
        style={{ minWidth: "120px" }}
        color="ignite"
        variant="outlined"
        onClick={() => setNewAssetOpen(true)}
      >
        New Asset
      </IgnButton>
      <Stack direction="row" spacing={1} style={{ width: "100%", alignItems: "center" }}>
        {/* <FormControlLabel control={<Switch checked={props.autoPlay} onChange={props.onAutoPlayChange} />} label="Autoplay" /> */}
        <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
        <IconButton onClick={handleSortClicked} style={iconButtonStyle}>
          <SortIcon />
        </IconButton>
        <IconButton onClick={props.onFiltersToggle} style={iconButtonStyle}>
          <FilterAltIcon />
        </IconButton>
      </Stack>
      <IgnButton variant="outlined" style={{ minWidth: "90px" }} onClick={props.onRefresh}>
        Refresh
      </IgnButton>
    </div>
  );
};

export default TopBar;

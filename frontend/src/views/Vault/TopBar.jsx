import React, { useEffect, useState } from "react"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import TextField from "@mui/material/TextField"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import ButtonGroup from "@mui/material/ButtonGroup"
import IconButton from "@mui/material/IconButton"
import HelpIcon from "@mui/icons-material/Help"
import BugReportIcon from "@mui/icons-material/BugReport"
import ThumbsUpDownIcon from "@mui/icons-material/ThumbsUpDown"
import Ingest from "../Ingest/Ingest"
import FormControlLabel from "@mui/material/FormControlLabel"
import Switch from "@mui/material/Switch"
import styles from "./TopBar.module.css"
import FilterAltIcon from "@mui/icons-material/FilterAlt"
import SortIcon from "@mui/icons-material/Sort"
import ContextMenu, { handleContextMenu } from "../../components/ContextMenu"
import SyncIcon from '@mui/icons-material/Sync';

const style = {
  display: "flex",
  justifyContent: "space-between",
  padding: "10px",
  paddingLeft: "20px",
  paddingRight: "20px",
  alignItems: "center"
}

function TopBar(props) {
  const [ingestOpen, setIngestOpen] = useState(false)
  const [sortMenu, setSortMenu] = useState(null)

  useEffect(() => {
    const sortData = localStorage.getItem("sortData")
    if (!sortData) return
    props.setQuery({sort: JSON.parse(sortData)})
  }, [])

  const handleSortClicked = e => {
    handleContextMenu(e, sortMenu, setSortMenu)
  }

  const handleSortChange = (field, reverse, label) => {
    const sortData = {field: field, reverse: reverse, label: label}
    props.setQuery({sort: sortData})
    localStorage.setItem("sortData", JSON.stringify(sortData))
  }

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
    }
  ]

  return (
    <div style={style}>
      <ContextMenu items={sortOptions} contextMenu={sortMenu}
        setContextMenu={setSortMenu}
      />
      <IconButton onClick={props.onRefresh} size="small">
        <SyncIcon style={{fontSize: "24px"}} />
      </IconButton>
      <Stack direction="row" spacing={1} style={{width: "100%", marginLeft: "100px", marginRight: "100px"}}>
        <FormControlLabel control={<Switch checked={props.autoPlay} onChange={props.onAutoPlayChange} />} label="Autoplay" />
        <TextField id="filterField" size="small" label="Search" variant="outlined" fullWidth onChange={props.onFilterChange} />
        <IconButton onClick={handleSortClicked}>
          <SortIcon />
        </IconButton>
        <IconButton onClick={props.onFiltersToggle}>
          <FilterAltIcon />
        </IconButton>
      </Stack>
      <ButtonGroup variant="text">
        <IconButton aria-label="docs">
          <HelpIcon />
        </IconButton>
        <IconButton aria-label="bug">
          <BugReportIcon />
        </IconButton>
        <IconButton aria-label="feedback">
          <ThumbsUpDownIcon />
        </IconButton>
      </ButtonGroup>
    </div>
  )
}

export default TopBar

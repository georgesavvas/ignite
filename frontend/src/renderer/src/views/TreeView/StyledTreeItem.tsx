import { SvgIcon } from "@mui/material";
import Box, { BoxProps } from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { treeItemClasses } from "@mui/x-tree-view";
import { TreeItem2, TreeItem2Props } from "@mui/x-tree-view/TreeItem2";
import { EnqueueSnackbar } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useState } from "react";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import { DIRCONTEXTOPTIONS } from "../../constants/directoryContextOptions";
import { CopyToClipboard, ShowInExplorer } from "../ContextActions";

type DirectoryDataType = {
  id?: string;
  path: string;
  kind: keyof typeof DIRCONTEXTOPTIONS;
  name: string;
  handleClick: (action: string, data: any) => void;
};

const getGenericContextItems = (data: DirectoryDataType, enqueueSnackbar: EnqueueSnackbar) => {
  return [
    {
      label: "Copy path",
      fn: () => CopyToClipboard(data.path, enqueueSnackbar),
    },
    {
      label: "Open in file explorer",
      fn: () => ShowInExplorer(data.path, enqueueSnackbar),
      divider: true,
    },
    {
      label: "Rename",
      fn: () => data.handleClick("rename", data),
    },
    {
      label: "Delete",
      fn: () => data.handleClick("delete", data),
      divider: true,
    },
  ];
};

const getSpecificContextItems = (data: DirectoryDataType) => {
  const kindOptions = DIRCONTEXTOPTIONS[data.kind];
  const namedOptions =
    (kindOptions && kindOptions[data.name as keyof typeof kindOptions]) || kindOptions.default;
  return namedOptions.map((contextOption: any) => ({
    label: contextOption.label,
    value: contextOption.name,
    dir_path: data.path,
    fn: () =>
      data.handleClick(contextOption.action || "create", {
        ...data,
        method: contextOption.name,
        kind: contextOption.dir_kind,
      }),
  }));
};

const StyledTreeItemRoot = styled(TreeItem2)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    paddingRight: theme.spacing(0),
    paddingLeft: theme.spacing(0),
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-expanded": {
      fontWeight: theme.typography.fontWeightRegular,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: "var(--tree-view-color)",
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  },
}));
interface StyledTreeItemProps extends TreeItem2Props {
  bgColor?: string;
  labelIcon: BoxProps["component"];
  labelInfo: string;
  labelText: string;
  handleContextMenuSelection: (action: string, data: any) => void;
  dirpath: string;
  dirkind: keyof typeof DIRCONTEXTOPTIONS;
  tasktype: string;
}

export const StyledTreeItem = (props: StyledTreeItemProps) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const {
    bgColor,
    color,
    labelIcon: LabelIcon,
    labelInfo,
    labelText,
    handleContextMenuSelection,
    ...other
  } = props;

  const handleClick = (action: string, data: any) => {
    handleContextMenuSelection(action, data);
    handleClose();
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const itemData = {
    path: props.dirpath,
    kind: props.dirkind,
    taskType: props.tasktype,
    name: labelText,
    handleClick: handleClick,
  };

  let contextItems = getGenericContextItems(itemData, enqueueSnackbar);
  contextItems = contextItems.concat(getSpecificContextItems(itemData));

  return (
    <div>
      <ContextMenu
        items={contextItems}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        title={props.labelText}
        subtitle={props.dirkind}
      />
      <StyledTreeItemRoot
        label={
          <div
            onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
            style={{ display: "flex", alignItems: "center", padding: 0.1, paddingRight: 0.8 }}
          >
            <Box
              component={LabelIcon as typeof SvgIcon}
              color="inherit"
              sx={{ height: "20px", width: "20px", mr: 1 }}
            />
            <Typography
              variant="body2"
              sx={{ textAlign: "left", fontWeight: "inherit", flexGrow: 1 }}
            >
              {labelText}
            </Typography>
            <Typography variant="caption" color="rgb(100,100,100)">
              {labelInfo}
            </Typography>
          </div>
        }
        // style={{
        //   "--tree-view-color": color,
        //   "--tree-view-bg-color": bgColor,
        // }}
        {...other}
      />
    </div>
  );
};

export default StyledTreeItem;

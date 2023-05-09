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

import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import { Autocomplete, AutocompleteGetTagProps, TextField, Typography } from "@mui/material";
import { Chip } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useSnackbar } from "notistack";
import { useCallback, useContext, useState } from "react";
import stc from "string-to-color";

import { ConfigContext, ConfigContextType } from "../contexts/ConfigContext";
import BuildFileURL from "../services/BuildFileURL";
import serverRequest from "../services/serverRequest";
import { hexToHsl } from "../utils/hexToHsl";
import { CopyToClipboard } from "../views/ContextActions";
import ContextMenu, { ContextMenuType, handleContextMenu } from "./ContextMenu";
import styles from "./Tags.module.css";

const namedStyles = {
  locked: {
    backgroundColor: "rgb(40, 40, 100)",
  },
  approved: {
    backgroundColor: "rgb(40,100,40)",
  },
  deprecated: {
    backgroundColor: "rgb(5, 5, 5)",
  },
};

interface TagsProps {
  tags: string[];
  entityPath?: string;
  onChange?: (tags: string[]) => void;
  onRefresh?: () => void;
}

export const Tags = (props: TagsProps) => {
  const [tagsWarning, setTagsWarning] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { config } = useContext(ConfigContext) as ConfigContextType as ConfigContextType;
  const { enqueueSnackbar } = useSnackbar();

  const contextItems = [
    {
      label: "Copy tags",
      fn: () => CopyToClipboard(props.tags.join(","), enqueueSnackbar),
    },
  ];

  const handleChange = (_: any, value: string[]) => {
    if (props.onChange) {
      props.onChange(value);
      setTagsWarning(false);
      return;
    }
    const data = {
      path: BuildFileURL(props.entityPath, config, { pathOnly: true, reverse: true }),
      tags: value,
    };
    serverRequest("set_tags", data).then(() => {
      if (props.onRefresh) props.onRefresh();
    });
    setTagsWarning(false);
  };

  const renderTags = useCallback((tags: string[], getTagProps: AutocompleteGetTagProps) => {
    return tags.map((tag, index) => (
      <Chip
        // key={tag}
        label={tag}
        size="small"
        sx={{ backgroundColor: hexToHsl(stc(tag), 80, 30) }}
        {...getTagProps({ index })}
      />
    ));
  }, []);

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <div
        className={styles.container}
        onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        <Autocomplete
          multiple
          size="small"
          freeSolo
          options={[]}
          value={props.tags}
          onChange={handleChange}
          fullWidth
          renderTags={renderTags}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Enter tags..."
              onChange={(e) => setTagsWarning(e.target.value !== "")}
              helperText={tagsWarning ? "Press enter to confirm tags" : undefined}
            />
          )}
        />
      </div>
    </>
  );
};

interface TagProps {
  name: string;
  onDelete: (name: string) => void;
}

const Tag = (props: TagProps) => {
  let style = {} as React.CSSProperties;
  if (namedStyles[props.name as keyof typeof namedStyles])
    style = namedStyles[props.name as keyof typeof namedStyles];
  else style = { backgroundColor: hexToHsl(stc(props.name), 80, 30) };

  const limit = 30;
  const nameFormatted =
    props.name.length < limit ? props.name : props.name.substring(0, limit) + "...";

  return (
    <div className={styles.tag} style={style}>
      <Typography>{nameFormatted}</Typography>
      <ClearIcon className={styles.clearIcon} onClick={() => props.onDelete(props.name)} />
    </div>
  );
};

interface NewTagsProps {
  onClick: () => void;
}

const NewTags = (props: NewTagsProps) => {
  return (
    <Tooltip title="Add Tags">
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className={styles.tagEdit}
        onClick={props.onClick}
      >
        <AddIcon />
      </div>
    </Tooltip>
  );
};

export default Tags;

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
import { Button, TextField, Typography } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { useSnackbar } from "notistack";
import { useContext, useRef, useState } from "react";
import stc from "string-to-color";

import ContextMenu, { ContextMenuType, handleContextMenu } from "../../components/ContextMenu";
import DataPlaceholder from "../../components/DataPlaceholder";
import Modal from "../../components/Modal";
import { ConfigContext, ConfigContextType } from "../../contexts/ConfigContext";
import BuildFileURL from "../../services/BuildFileURL";
import serverRequest from "../../services/serverRequest";
import { hexToHsl } from "../../utils/hexToHsl";
import { CopyToClipboard } from "../ContextActions";
import styles from "./TagContainer.module.css";

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

interface TagContainerProps {
  tags: string[];
  entityPath?: string;
  onAdd?: (tags: string) => void;
  onRemove?: (tag: string) => void;
  onRefresh?: () => void;
}

export const TagContainer = (props: TagContainerProps) => {
  const [newTagsOpen, setNewTagsOpen] = useState(false);
  const [newTags, setNewTags] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);
  const { config } = useContext(ConfigContext) as ConfigContextType as ConfigContextType;
  const { enqueueSnackbar } = useSnackbar();
  const newTagsRef = useRef();
  console.log("Not sure if this is a list or string", props.tags);
  const contextItems = [
    {
      label: "Copy tags",
      fn: () => CopyToClipboard(props.tags.join(","), enqueueSnackbar),
    },
    {
      label: "Add tags",
      fn: () => {
        setNewTags("");
        setNewTagsOpen(true);
      },
    },
  ];

  const handleAddTags = () => {
    if (props.onAdd) {
      props.onAdd(newTags);
      setNewTagsOpen(false);
      return;
    }
    const data = {
      path: BuildFileURL(props.entityPath, config, { pathOnly: true, reverse: true }),
      tags: newTags,
    };
    serverRequest("add_tags", data).then(() => {
      if (props.onRefresh) props.onRefresh();
    });
    setNewTagsOpen(false);
  };

  const handleRemoveTag = (tag: string) => {
    if (props.onRemove) {
      props.onRemove(tag);
      setNewTagsOpen(false);
      return;
    }
    const data = {
      path: BuildFileURL(props.entityPath, config, { pathOnly: true, reverse: true }),
      tags: tag,
    };
    serverRequest("remove_tags", data).then(() => {
      if (props.onRefresh) props.onRefresh();
    });
  };

  return (
    <>
      <ContextMenu items={contextItems} contextMenu={contextMenu} setContextMenu={setContextMenu} />
      <Modal
        open={newTagsOpen}
        onClose={() => setNewTagsOpen(false)}
        maxWidth="md"
        buttons={[
          <Button key="create" type="submit">
            Create
          </Button>,
        ]}
        title="Add Tags"
        onFormSubmit={handleAddTags}
        focusRef={newTagsRef}
      >
        <TextField
          onChange={(e) => setNewTags(e.target.value)}
          value={newTags}
          size="small"
          fullWidth
          autoFocus
          inputRef={newTagsRef}
        />
        <Typography variant="caption">Multiple tags can be separated by commas</Typography>
      </Modal>
      <div
        className={styles.container}
        onContextMenu={(e) => handleContextMenu(e, contextMenu, setContextMenu)}
      >
        {props.tags.map((tag, index) => (
          <Tag name={tag} key={index} onDelete={() => handleRemoveTag(tag)} />
        ))}
        <NewTags
          onClick={() => {
            setNewTags("");
            setNewTagsOpen(true);
          }}
        />
        {!props.tags.length ? (
          <DataPlaceholder text="No tags" style={{ padding: 0 }} variant="h5" />
        ) : null}
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

export default TagContainer;

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

import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";
import { EnqueueSnackbar } from "@renderer/types/common";
import { useEffect, useRef, useState } from "react";

import IgnButton from "../../components/IgnButton";
import Modal from "../../components/Modal";
import serverRequest from "../../services/serverRequest";
import FilterBuilder, { ExpressionType } from "./FilterBuilder";

interface EditCollProps {
  data: { expression?: any; path: string; name: string };
  open: boolean;
  onClose: () => void;
  enqueueSnackbar: EnqueueSnackbar;
  fn: () => void;
}

export const EditColl = ({ data, open = false, onClose, enqueueSnackbar, fn }: EditCollProps) => {
  const [filterData, setFilterData] = useState<{ [key: string]: ExpressionType }>({});

  useEffect(() => {
    if (data.expression) setFilterData({ ...data["expression"] });
    else setFilterData({});
  }, [data.path]);

  const handleConfirm = () => {
    serverRequest("edit_collection", { data: { ...data, expression: filterData.expression } }).then(
      (resp) => {
        if (resp.ok) enqueueSnackbar("Success!", { variant: "success" });
        else enqueueSnackbar("Couldn't edit collection.", { variant: "error" });
      }
    );
    if (fn) fn();
    onClose();
  };

  const defaultExpr = '{ "condition": "and", "filters": [{ "": "" }, { "": "" }]}';

  return (
    <Modal
      open={open}
      onFormSubmit={handleConfirm}
      onClose={onClose}
      maxWidth="xl"
      title={`Editing ${data.name}`}
      buttons={[
        <IgnButton key="create" type="submit">
          Confirm
        </IgnButton>,
      ]}
    >
      <FilterBuilder
        default={JSON.stringify(data.expression) || defaultExpr}
        onChange={(value) => setFilterData({ expression: value })}
      />
    </Modal>
  );
};

interface RenameCollProps {
  data: { expression?: any; path: string; name: string };
  open: boolean;
  onClose: () => void;
  enqueueSnackbar: EnqueueSnackbar;
  fn: () => void;
}

export const RenameColl = ({
  data,
  open = false,
  onClose,
  enqueueSnackbar,
  fn,
}: RenameCollProps) => {
  const [nameValue, setNameValue] = useState("");
  const textFieldRef = useRef();

  useEffect(() => {
    setNameValue(data.name);
  }, [data.name]);

  const handleConfirm = () => {
    serverRequest("rename_collection", { data: { ...data, name: nameValue } }).then((resp) => {
      if (resp.ok) enqueueSnackbar("Renamed!", { variant: "success" });
      else enqueueSnackbar("Couldn't rename collection.", { variant: "error" });
    });
    if (fn) fn();
    onClose();
  };

  return (
    <Modal
      open={open}
      focusRef={textFieldRef}
      maxWidth="sm"
      onClose={onClose}
      onFormSubmit={handleConfirm}
      title={`Renaming ${data.name}`}
      buttons={[
        <IgnButton key="create" type="submit">
          Confirm
        </IgnButton>,
      ]}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        inputRef={textFieldRef}
        style={{ marginTop: "10px" }}
      />
    </Modal>
  );
};

interface DeleteCollProps {
  data: { expression?: any; path: string; name: string };
  open: boolean;
  onClose: () => void;
  enqueueSnackbar: EnqueueSnackbar;
  fn: () => void;
}

export const DeleteColl = ({
  data,
  open = false,
  onClose,
  enqueueSnackbar,
  fn,
}: DeleteCollProps) => {
  const handleConfirm = () => {
    serverRequest("delete_collection", { data: data }).then((resp) => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", { variant: "success" });
      else enqueueSnackbar("There was an issue with deleting this.", { variant: "error" });
    });
    if (fn) fn();
    onClose();
  };

  return (
    <Modal
      open={open}
      buttons={[
        <Button key="confirm" type="submit">
          Confirm
        </Button>,
      ]}
      onFormSubmit={handleConfirm}
      onClose={onClose}
      text={`This will permanently delete the ${data.name} collection!`}
      title="Are you sure?"
      maxWidth="sm"
    />
  );
};

interface CreateCollProps {
  data: { expression?: any; path: string; name: string };
  open: boolean;
  onClose: () => void;
  enqueueSnackbar: EnqueueSnackbar;
  fn: () => void;
}

export const CreateColl = ({
  data,
  open = false,
  onClose,
  enqueueSnackbar,
  fn,
}: CreateCollProps) => {
  const [nameValue, setNameValue] = useState("");
  const textFieldRef = useRef();

  useEffect(() => {
    setNameValue("");
  }, [data.name]);

  const handleConfirm = () => {
    data.name = nameValue;
    serverRequest("create_collection", { data: data }).then((resp) => {
      enqueueSnackbar(resp.text, { variant: resp.ok ? "success" : "error" });
      onClose();
      if (fn) fn();
    });
  };

  return (
    <Modal
      open={open}
      focusRef={textFieldRef}
      maxWidth="sm"
      onClose={onClose}
      onFormSubmit={handleConfirm}
      title="Create"
      buttons={[
        <IgnButton key="create" type="submit">
          Create
        </IgnButton>,
      ]}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        inputRef={textFieldRef}
        style={{ marginTop: "10px" }}
      />
    </Modal>
  );
};

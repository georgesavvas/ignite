import { OptionsObject, ProviderContext, SnackbarKey } from "notistack";
import React from "react";

export type UnknownEvent = React.ChangeEvent<unknown>;

export type ClickEvent = React.MouseEvent<HTMLElement>;

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;

export type GenericObject = { [key: string]: any };

export type EnqueueSnackbar = (message: string, options: OptionsObject) => SnackbarKey;

export interface ContextItem {
  label: string;
  fn: () => void;
  divider?: boolean;
}

export interface Directory {
  path: string;
  protected: boolean;
  repr: string;
  attributes: IgniteAttribute[];
  dir_kind:
    | "directory"
    | "asset"
    | "assetversion"
    | "build"
    | "component"
    | "group"
    | "project"
    | "scene"
    | "sequence"
    | "shot"
    | "task";
  thumbnail: IgniteComponent;
  anchor: string;
  project: string;
  tags: string[];
  context: string;
  group: string;
  name: string;
  uri: string;
  creation_time: string;
  modification_time: string;
}

export type IgniteAttribute = {
  id: number;
  name: string;
  override: string;
};

export type IgniteAction = {
  label: string;
};

export type IgniteActions = {
  [name: string]: IgniteAction;
};

export interface Asset extends Directory {
  versions: string[];
  latest_v: string;
  best_v: string;
  next_path: string;
}

export interface AssetVersion extends Directory {
  components: IgniteComponent[];
  asset: string;
  task: string;
  version: string;
  versions: string[];
}

export interface Scene extends Directory {
  dcc: string;
  scene: string;
  vsn: string;
  attributes: any;
  comment: string;
  thumbnail: string;
  extension: string;
}

export interface IgniteComponent {
  name: string;
  filename: string;
  path: string;
  ext: string;
  static: boolean;
  first_frame: string;
  last_frame: string;
  frames: string[];
  uri: string;
  dir_kind: "scene";
  context: string;
  protected: boolean;
}

export type CrateType = {
  id?: string;
  entities?: Entity[];
  label: string;
};

export type Entity = Directory | Asset | AssetVersion | Scene | Component;

export type Dcc = {
  scenes: string[];
  exts: string[];
  name: string;
  path: string;
};

// type Props = React.ComponentPropsWithoutRef<"button">;

// interface Props extends React.ComponentPropsWithoutRef<"button"> {
//   specialProp: number;
// }

// type Props = React.PropsWithChildren<{
//   onClick: () => void;
// }>;

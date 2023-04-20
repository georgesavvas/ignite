import React from "react";

export type UnknownEvent = React.ChangeEvent<unknown>;

export type ClickEvent = React.MouseEventHandler<HTMLButtonElement>;

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;

export interface ContextItem {
  label: string;
  fn: () => void;
  divider?: boolean;
}

export interface Directory {
  path: string;
  protected: boolean;
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
  thumbnail: Component;
  anchor: string;
  project: string;
  tags: string;
  context: string;
  group: string;
  name: string;
  uri: string;
  creation_time: string;
  modification_time: string;
}

export interface Asset extends Directory {
  versions: string[];
  latest_v: string;
  best_v: string;
  next_path: string;
}

export interface AssetVersion extends Directory {
  components: Component[];
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

export interface Component {
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
}

// type Props = React.ComponentPropsWithoutRef<"button">;

// interface Props extends React.ComponentPropsWithoutRef<"button"> {
//   specialProp: number;
// }

// type Props = React.PropsWithChildren<{
//   onClick: () => void;
// }>;

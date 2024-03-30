import { OptionsObject, SnackbarKey } from "notistack";
import React from "react";
import { HandlerProps } from "react-reflex";

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

export interface IgniteDirectory {
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
  thumbnail?: IgniteComponent;
  anchor: string;
  project: string;
  tags: string[];
  context: string;
  group: string;
  name: string;
  uri: string;
  creation_time: string;
  modification_time: string;
  task?: string;
  icon?: string;
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

export interface IgniteAsset extends IgniteDirectory {
  versions: string[];
  latest_v: string;
  best_v: string;
  next_path: string;
}

export interface IgniteAssetVersion extends IgniteDirectory {
  components: IgniteComponent[];
  asset: string;
  task: string;
  version: string;
  versions: string[];
}

export interface IgniteScene extends IgniteDirectory {
  dcc: string;
  scene: string;
  vsn: string;
  attributes: any;
  comment: string;
  thumbnail?: IgniteComponent;
  extension: string;
  task: string;
}

export interface IgniteComponent {
  name: string;
  filename: string;
  path: string;
  path_nr: string;
  ext: string;
  static: boolean;
  first_frame: number;
  last_frame: number;
  frames: string[];
  uri: string;
  dir_kind: "scene";
  context: string;
  protected: boolean;
}

export type CrateType = {
  id?: string;
  entities?: IgniteEntity[] | IgniteComponent[];
  label: string;
};

export type IgniteEntity = IgniteDirectory | IgniteAsset | IgniteAssetVersion | IgniteScene;

export type CrateEntity = IgniteEntity | IgniteComponent;

export type DccType = {
  scenes: string[];
  exts: string[];
  name: string;
  path: string;
  keywords: string[];
};

export interface WebSocketWithInterval extends WebSocket {
  interval?: NodeJS.Timer;
}

export interface SaveReflexLayoutProps extends HandlerProps {
  domElement: HTMLElement;
}

// React.ComponentType<SvgIconProps>

// type Props = React.ComponentPropsWithoutRef<"button">;

// interface Props extends React.ComponentPropsWithoutRef<"button"> {
//   specialProp: number;
// }

// type Props = React.PropsWithChildren<{
//   onClick: () => void;
// }>;

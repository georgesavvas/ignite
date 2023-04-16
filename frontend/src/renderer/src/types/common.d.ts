import React from "react";

export type UnknownEvent = React.ChangeEvent<unknown>;

export type ClickEvent = React.MouseEventHandler<HTMLButtonElement>;

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;

// type Props = React.ComponentPropsWithoutRef<"button">;

// interface Props extends React.ComponentPropsWithoutRef<"button"> {
//   specialProp: number;
// }

// type Props = React.PropsWithChildren<{
//   onClick: () => void;
// }>;

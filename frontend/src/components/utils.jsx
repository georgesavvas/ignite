import React from 'react';

export function CopyToClipboard(text, enqueueSnackbar) {
  navigator.clipboard.writeText(text);
  enqueueSnackbar("Copied to clipboard!", {variant: "success"});
}

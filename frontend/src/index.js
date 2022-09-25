
import React from "react";
import {createRoot} from "react-dom/client";

import * as Sentry from "@sentry/electron";
import {BrowserTracing} from "@sentry/tracing";

import "./index.css";
import App from "./App";


// Sentry.init({dsn: "https://3037f050f6194c0dbc82183b252475fa@o1421552.ingest.sentry.io/6767421"});
Sentry.init({
  dsn: "https://b72a96c33b264edcae62be494ba6b47c@o1421552.ingest.sentry.io/6767423",
  integrations: [new BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from "react";
import { createRoot } from "react-dom/client";
import { InspireSite } from "../app/site/InspireSite";
import "../app/globals.css";
import "../app/portal.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><InspireSite /></React.StrictMode>);

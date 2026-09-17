import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import { StandaloneApp } from "./ProductDemo.jsx";

createRoot(document.getElementById("root")).render(
  <MotionConfig reducedMotion="user">
    <StandaloneApp />
  </MotionConfig>,
);

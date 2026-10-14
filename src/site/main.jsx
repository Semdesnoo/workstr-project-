import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "./site.css";
import { Header, Footer } from "./ui.jsx";
import { PAGES, NotFound } from "./pages.jsx";

// One bundle, many static HTML entries: each sets <body data-page> (and its own SEO head).
const Page = PAGES[document.body.dataset.page] || NotFound;
document.documentElement.classList.add("js");
createRoot(document.getElementById("root")).render(<><a className="skip" href="#main">Naar inhoud</a><Header /><main id="main"><Page /></main><Footer /></>);

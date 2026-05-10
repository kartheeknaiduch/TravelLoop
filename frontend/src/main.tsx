import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@/api";

setAuthTokenGetter(() => localStorage.getItem("traveloop_token"));

createRoot(document.getElementById("root")!).render(<App />);

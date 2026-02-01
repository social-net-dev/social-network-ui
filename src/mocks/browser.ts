/**
 * MSW Browser Worker
 * Starts the Service Worker that intercepts requests in the browser
 */
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

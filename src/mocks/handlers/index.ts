/**
 * MSW Handlers - Central Export
 */
import { authHandlers } from "./auth.handlers";
import { feedHandlers } from "./feed.handlers";

export const handlers = [
  ...authHandlers,
  ...feedHandlers,
];

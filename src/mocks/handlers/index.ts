/**
 * MSW Handlers - Central Export
 */
import { authHandlers } from './auth.handlers';
import { feedHandlers } from './feed.handlers';
import { fieldHandlers } from './field.handlers';
import { mediaHandlers } from './media.handlers';

export const handlers = [...authHandlers, ...feedHandlers, ...fieldHandlers, ...mediaHandlers];

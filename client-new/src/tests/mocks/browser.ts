import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker para navegador (desarrollo)
export const worker = setupWorker(...handlers);
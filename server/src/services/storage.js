// Фасад хранилища вложений: реализация разнесена по папке storage/
export { PROVIDERS, providerStatus, listProviders } from './storage/providers.js';
export { getActiveProvider, setActiveProvider } from './storage/selection.js';
export { putObject, getObjectStream } from './storage/objects.js';
export { probeProvider } from './storage/probe.js';

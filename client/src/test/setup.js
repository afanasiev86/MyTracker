import { vi } from 'vitest';

// jsdom не знает этих API: antd использует matchMedia и ResizeObserver, FLIP-анимация доски — DOMMatrixReadOnly
window.matchMedia = window.matchMedia || ((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}));

globalThis.ResizeObserver = globalThis.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.stubGlobal('DOMMatrixReadOnly', class { m41 = 0; m42 = 0; });

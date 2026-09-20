// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver, which Leaflet's map (via MapView)
// relies on. Provide a no-op so components that use it can render under test.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

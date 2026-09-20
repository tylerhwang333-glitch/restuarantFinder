import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

const mockRestaurants = [
  { name: 'The Burger Joint', address: '221 Market St', categories: ['fast_food'], open_now: null, hours: null },
];

beforeEach(() => {
  global.navigator.geolocation = {
    getCurrentPosition: (success) => success({ coords: { latitude: 37.77, longitude: -122.41 } }),
  };
  global.fetch = jest.fn((url) => {
    const body = url.includes('/restaurants/random') ? mockRestaurants[0] : mockRestaurants;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('loads and shows restaurants for the granted location', async () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /restaurant finder/i })).toBeInTheDocument();
  await waitFor(() => expect(screen.getByText('The Burger Joint')).toBeInTheDocument());
});

test('shows the Surprise me button', async () => {
  render(<App />);
  await waitFor(() => expect(screen.getByRole('button', { name: /surprise me/i })).toBeInTheDocument());
});

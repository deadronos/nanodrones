import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock PlayCanvasShell to avoid heavy runtime logic in unit tests
vi.mock('../src/pc/PlayCanvasShell', () => {
  return {
    PlayCanvasShell: () => <div data-testid="playcanvas-shell" />,
  };
});

import App from '../src/App';

describe('App', () => {
  it('renders main heading and mounts PlayCanvasShell placeholder', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nano Drones Commander');
    expect(screen.getByTestId('playcanvas-shell')).toBeInTheDocument();
  });
});

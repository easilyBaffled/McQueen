import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { greet } from '../greeting';
import GreetingBadge from '../GreetingBadge';

describe('TypeScript support', () => {
  it('can import a .ts utility module', () => {
    expect(greet('World')).toBe('Hello, World!');
  });

  it('can render a .tsx component', () => {
    render(<GreetingBadge name="McQueen" />);
    expect(screen.getByText('Hello, McQueen!')).toBeInTheDocument();
  });
});

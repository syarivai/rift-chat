import { render, screen } from '@testing-library/react-native';

import { Avatar, initials } from './avatar';

describe('initials', () => {
  it.each([
    ['Alice Johnson', 'AJ'],
    ['Bob', 'B'],
    ['mary jane watson', 'MJ'],
    ['  Eva   Brown  ', 'EB'],
  ])('derives %s -> %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('does not throw on an empty name', () => {
    expect(initials('')).toBe('');
  });
});

describe('Avatar', () => {
  it('renders initials underneath, so a slow or failed image still shows something', async () => {
    await render(<Avatar uri="https://example.test/a.png" name="Alice Johnson" />);
    expect(screen.getByText('AJ')).toBeTruthy();
  });
});

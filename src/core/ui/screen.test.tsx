import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Screen } from './screen';

describe('Screen', () => {
  it('renders its children', async () => {
    await render(
      <Screen>
        <Text>content</Text>
      </Screen>,
    );
    expect(screen.getByText('content')).toBeTruthy();
  });
});

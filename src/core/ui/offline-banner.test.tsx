import { onlineManager } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';

import { OfflineBanner } from './offline-banner';

afterEach(() => onlineManager.setOnline(true));

describe('OfflineBanner', () => {
  it('renders nothing while online', async () => {
    onlineManager.setOnline(true);
    await render(<OfflineBanner />);

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('announces itself as an alert while offline', async () => {
    onlineManager.setOnline(false);
    await render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('common.offline')).toBeTruthy();
  });
});

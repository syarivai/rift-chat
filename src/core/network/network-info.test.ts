import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { setupOnlineManager } from './network-info';

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: { addEventListener: jest.fn(() => () => {}) },
}));

const mockedNetInfo = NetInfo as unknown as { addEventListener: jest.Mock };

/** Runs the listener NetInfo would have called, with a given connectivity state. */
function emit(state: { isConnected: boolean | null; isInternetReachable: boolean | null }) {
  setupOnlineManager();
  const listener = mockedNetInfo.addEventListener.mock.calls.at(-1)?.[0];
  listener?.(state);
}

afterEach(() => onlineManager.setOnline(true));

describe('setupOnlineManager', () => {
  it('reports online when connected and reachable', () => {
    emit({ isConnected: true, isInternetReachable: true });
    expect(onlineManager.isOnline()).toBe(true);
  });

  it('reports offline when not connected', () => {
    emit({ isConnected: false, isInternetReachable: false });
    expect(onlineManager.isOnline()).toBe(false);
  });

  it('reports offline when connected but the internet is explicitly unreachable', () => {
    emit({ isConnected: true, isInternetReachable: false });
    expect(onlineManager.isOnline()).toBe(false);
  });

  it('stays online while reachability is still unknown', () => {
    // null means "not determined yet". Treating it as offline would flash the banner on
    // every cold start.
    emit({ isConnected: true, isInternetReachable: null });
    expect(onlineManager.isOnline()).toBe(true);
  });
});

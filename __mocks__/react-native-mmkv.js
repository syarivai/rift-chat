/**
 * react-native-mmkv v4 is a Nitro module — importing it under Jest fails with
 * "Failed to get NitroModules: The native NitroModules Turbo/Native-Module could not be found".
 * It does not ship a usable automatic Jest mock at this version, so this is it.
 *
 * Jest picks up __mocks__/<package> at the project root automatically for node_modules
 * packages, with no jest.mock() call needed in test files.
 */
const stores = new Map();

function createMMKV(config = {}) {
  const id = config.id ?? 'mmkv.default';
  if (!stores.has(id)) stores.set(id, new Map());
  const store = stores.get(id);

  return {
    set: (key, value) => store.set(key, String(value)),
    getString: (key) => store.get(key),
    getNumber: (key) => (store.has(key) ? Number(store.get(key)) : undefined),
    getBoolean: (key) => (store.has(key) ? store.get(key) === 'true' : undefined),
    remove: (key) => store.delete(key),
    clearAll: () => store.clear(),
    contains: (key) => store.has(key),
  };
}

module.exports = {
  createMMKV,
  existsMMKV: () => false,
  deleteMMKV: (id) => stores.delete(id),
};

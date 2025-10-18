const RPC_BRIDGE_SYMBOL = Symbol.for('orpc.electron.bridge');

const isPlainObject = value => typeof value === 'object' && value !== null;

const ensureArrayPath = path => {
  if (Array.isArray(path)) {
    return path.map(String);
  }
  if (typeof path === 'string') {
    return path.split('.').filter(Boolean);
  }
  throw new TypeError('RPC path must be an array of keys or a dot-separated string.');
};

const resolveProcedure = (router, path) => {
  const segments = ensureArrayPath(path);
  if (segments.length === 0) {
    throw new Error('Cannot resolve a procedure without a path.');
  }

  let current = router;
  for (const segment of segments) {
    if (!isPlainObject(current) && typeof current !== 'function') {
      throw new Error(`Encountered a non-router segment while resolving "${segments.join('.')}".`);
    }

    current = current[segment];

    if (current === undefined) {
      throw new Error(`Procedure "${segments.join('.')}" was not found on the router.`);
    }
  }

  if (typeof current !== 'function') {
    throw new Error(`The resolved value for "${segments.join('.')}" is not a callable procedure.`);
  }

  return current;
};

const createDefinition = router => {
  if (typeof router === 'function') {
    return true;
  }

  if (!isPlainObject(router)) {
    return false;
  }

  return Object.keys(router).reduce((definition, key) => {
    definition[key] = createDefinition(router[key]);
    return definition;
  }, {});
};

const createElectronRpcBridge = ({ router, createContext } = {}) => {
  if (!isPlainObject(router)) {
    throw new TypeError('A router object is required to create an electron RPC bridge.');
  }

  const bridge = {
    definition: createDefinition(router),
    async call(path, args = []) {
      const procedure = resolveProcedure(router, path);
      const finalArgs = Array.isArray(args) ? args : [args];
      const context = typeof createContext === 'function' ? await createContext() : undefined;
      const result = context === undefined ? procedure(...finalArgs) : procedure(context, ...finalArgs);
      return await Promise.resolve(result);
    },
  };

  Object.defineProperty(bridge, RPC_BRIDGE_SYMBOL, {
    value: true,
    enumerable: false,
  });

  return bridge;
};

const isBridge = value => Boolean(value && value[RPC_BRIDGE_SYMBOL]);

const createProxyHandler = (bridge, path = []) => ({
  get(_target, key) {
    if (key === 'path') {
      return [...path];
    }

    return new Proxy(() => {}, createProxyHandler(bridge, [...path, String(key)]));
  },
  apply(_target, _thisArg, args) {
    if (path.length === 0) {
      throw new Error('Cannot invoke the RPC client root. Select a procedure first.');
    }

    return bridge.call(path, args);
  },
});

const createElectronRpcClient = ({ bridge } = {}) => {
  if (!isBridge(bridge)) {
    throw new TypeError('A valid electron RPC bridge is required to create a client.');
  }

  return new Proxy(() => {}, createProxyHandler(bridge));
};

const splitProcedurePath = path => ensureArrayPath(path);

module.exports = {
  createElectronRpcBridge,
  createElectronRpcClient,
  splitProcedurePath,
};

import { contextBridge } from 'electron';
import { createElectronRpcBridge } from '@orpc/electron-adapter';
import { appRouter } from '../server/orpc/router';

const bridge = createElectronRpcBridge({
  router: appRouter,
});

contextBridge.exposeInMainWorld('rpc', bridge);

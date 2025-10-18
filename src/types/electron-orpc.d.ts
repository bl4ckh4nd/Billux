import type { ElectronRpcBridge } from '@orpc/electron-adapter';
import type { AppRouter } from '../server/orpc/router';

declare global {
  interface Window {
    rpc: ElectronRpcBridge<AppRouter>;
  }
}

export {};

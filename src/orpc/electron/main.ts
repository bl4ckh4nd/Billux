import { RPCHandler } from '@orpc/server/message-port';
import { router } from '../router';

type IpcMainEvent = { ports: MessagePort[] };

type IpcMainLike = {
  on(channel: string, listener: (event: IpcMainEvent) => void): void;
};

export const createORPCMainHandler = () => new RPCHandler(router);

export const registerORPCServer = (ipcMain: IpcMainLike, channel = 'start-orpc-server') => {
  const handler = createORPCMainHandler();

  ipcMain.on(channel, event => {
    const [serverPort] = event.ports;

    if (serverPort) {
      handler.upgrade(serverPort);
      serverPort.start();
    }
  });

  return handler;
};

export const DEFAULT_SERVER_CHANNEL = 'start-orpc-server';
export const DEFAULT_CLIENT_EVENT = 'start-orpc-client';

type IpcRendererLike = {
  postMessage(channel: string, message: unknown, ports?: MessagePort[]): void;
};

type WindowLike = Window & typeof globalThis;

export const registerORPCPreloadBridge = (
  ipcRenderer: IpcRendererLike,
  options: {
    serverChannel?: string;
    clientEvent?: string;
    targetWindow?: WindowLike;
  } = {}
) => {
  const { serverChannel = DEFAULT_SERVER_CHANNEL, clientEvent = DEFAULT_CLIENT_EVENT, targetWindow = window } = options;

  targetWindow.addEventListener('message', event => {
    if (event.data === clientEvent) {
      const [serverPort] = event.ports ?? [];

      if (serverPort) {
        ipcRenderer.postMessage(serverChannel, null, [serverPort]);
      }
    }
  });
};

import {
  createElectronRpcClient,
  splitProcedurePath,
  type ProcedureArgs,
  type ProcedurePath,
  type ProcedureResult,
  type RpcClient,
} from '@orpc/electron-adapter';
import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AppRouter } from '../server/orpc/router';

const bridge = typeof window !== 'undefined' ? window.rpc : undefined;

const client: RpcClient<AppRouter> | null = bridge
  ? createElectronRpcClient<AppRouter>({ bridge })
  : null;

const ensureClient = (): RpcClient<AppRouter> => {
  if (!client) {
    throw new Error(
      'The Electron RPC bridge is not available. Ensure the preload script has exposed the bridge before using renderer hooks.',
    );
  }

  return client;
};

const callProcedure = async <TPath extends ProcedurePath<AppRouter>>(
  path: TPath,
  args: ProcedureArgs<AppRouter, TPath> = [] as ProcedureArgs<AppRouter, TPath>,
): Promise<ProcedureResult<AppRouter, TPath>> => {
  const activeClient = ensureClient();
  const segments = splitProcedurePath(path);

  let target: unknown = activeClient;
  for (const segment of segments) {
    target = (target as Record<string, unknown>)[segment];
  }

  const procedure = target as (...procedureArgs: ProcedureArgs<AppRouter, TPath>) => Promise<
    ProcedureResult<AppRouter, TPath>
  >;

  return procedure(...args);
};

const createQueryKey = <TPath extends ProcedurePath<AppRouter>>(
  path: TPath,
  args: ProcedureArgs<AppRouter, TPath>,
) => ['rpc', path, ...args];

export const useRpcQuery = <TPath extends ProcedurePath<AppRouter>>( 
  path: TPath,
  args?: ProcedureArgs<AppRouter, TPath>,
  options?: UseQueryOptions<ProcedureResult<AppRouter, TPath>, Error>,
): UseQueryResult<ProcedureResult<AppRouter, TPath>, Error> => {
  const memoizedArgs = useMemo(
    () => (args ?? []) as ProcedureArgs<AppRouter, TPath>,
    [args],
  );

  return useQuery({
    queryKey: createQueryKey(path, memoizedArgs),
    queryFn: () => callProcedure(path, memoizedArgs),
    ...options,
  });
};

export const useRpcMutation = <TPath extends ProcedurePath<AppRouter>>( 
  path: TPath,
  options?: UseMutationOptions<
    ProcedureResult<AppRouter, TPath>,
    Error,
    ProcedureArgs<AppRouter, TPath>
  >,
): UseMutationResult<ProcedureResult<AppRouter, TPath>, Error, ProcedureArgs<AppRouter, TPath>> =>
  useMutation({
    mutationKey: ['rpc', path],
    mutationFn: variables => callProcedure(path, variables),
    ...options,
  });

export { client as rpcClient };

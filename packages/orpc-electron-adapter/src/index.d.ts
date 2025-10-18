export type AnyRouter = Record<string, AnyRouter | AnyProcedure>;
export type AnyProcedure = (...args: unknown[]) => unknown;

export interface ElectronRpcBridge<TRouter extends AnyRouter> {
  readonly definition: RouterDefinition<TRouter>;
  call(path: string | readonly string[], args?: unknown[] | unknown): Promise<unknown>;
}

export interface CreateElectronRpcBridgeOptions<TRouter extends AnyRouter> {
  router: TRouter;
  createContext?: () => unknown | Promise<unknown>;
}

export type RouterDefinition<TRouter> = {
  [K in keyof TRouter]: TRouter[K] extends AnyProcedure ? true : TRouter[K] extends AnyRouter ? RouterDefinition<TRouter[K]> : false;
};

export type RpcClient<TRouter extends AnyRouter> = {
  [K in keyof TRouter]: TRouter[K] extends AnyProcedure
    ? (...args: Parameters<TRouter[K]>) => Promise<Awaited<ReturnType<TRouter[K]>>>
    : TRouter[K] extends AnyRouter
    ? RpcClient<TRouter[K]>
    : never;
};

export type ProcedurePath<TRouter extends AnyRouter> = JoinPath<ExtractProcedurePaths<TRouter>>;

export type ProcedureArgs<TRouter extends AnyRouter, TPath extends ProcedurePath<TRouter>> = Parameters<
  ExtractProcedureByPath<TRouter, TPath>
>;

export type ProcedureResult<TRouter extends AnyRouter, TPath extends ProcedurePath<TRouter>> = Awaited<
  ReturnType<ExtractProcedureByPath<TRouter, TPath>>
>;

type ExtractProcedurePaths<TRouter extends AnyRouter> = {
  [K in keyof TRouter]: TRouter[K] extends AnyProcedure
    ? [Extract<K, string>]
    : TRouter[K] extends AnyRouter
    ? PrependPath<Extract<K, string>, ExtractProcedurePaths<TRouter[K]>>
    : never;
}[keyof TRouter];

type PrependPath<Prefix extends string, Paths> = Paths extends readonly string[]
  ? [Prefix, ...Paths]
  : Paths extends readonly string[][]
  ? { [K in keyof Paths]: [Prefix, ...Extract<Paths[K], readonly string[]>] }[number]
  : never;

type JoinPath<Path extends readonly string[]> = Path extends []
  ? never
  : Path extends [infer Only]
  ? Only extends string
    ? Only
    : never
  : Path extends [infer Head, ...infer Tail]
  ? Head extends string
    ? Tail extends readonly string[]
      ? `${Head}.${JoinPath<Tail>}`
      : never
    : never
  : never;

type SplitPath<TPath extends string> = TPath extends `${infer Head}.${infer Tail}`
  ? [Head, ...SplitPath<Tail>]
  : [TPath];

type ExtractProcedureByPath<TRouter extends AnyRouter, TPath extends string> = ResolveProcedureBySegments<
  TRouter,
  SplitPath<TPath>
>;

type ResolveProcedureBySegments<TRouter extends AnyRouter, TSegments extends readonly string[]> = TSegments extends [
  infer Head,
  ...infer Tail
]
  ? Head extends keyof TRouter
    ? Tail extends []
      ? TRouter[Head]
      : TRouter[Head] extends AnyRouter
      ? ResolveProcedureBySegments<TRouter[Head], Extract<Tail, readonly string[]>>
      : never
    : never
  : never;

export function createElectronRpcBridge<TRouter extends AnyRouter>(
  options: CreateElectronRpcBridgeOptions<TRouter>
): ElectronRpcBridge<TRouter>;

export interface CreateElectronRpcClientOptions<TRouter extends AnyRouter> {
  bridge: ElectronRpcBridge<TRouter>;
}

export function createElectronRpcClient<TRouter extends AnyRouter>(
  options: CreateElectronRpcClientOptions<TRouter>
): RpcClient<TRouter>;

export function splitProcedurePath(path: string | readonly string[]): string[];

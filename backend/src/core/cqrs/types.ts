// ——— Commands ————————————————————————————————————————————————————————————————

export interface Command<R = void> {
  readonly _commandType: string;
}

export interface CommandHandler<C extends Command<R>, R = void> {
  execute(command: C): Promise<R>;
}

// ——— Queries —————————————————————————————————————————————————————————————————

export interface Query<R> {
  readonly _queryType: string;
}

export interface QueryHandler<Q extends Query<R>, R> {
  handle(query: Q): Promise<R>;
}

// ——— Command Bus —————————————————————————————————————————————————————————————

type AnyCommandHandler = CommandHandler<Command<unknown>, unknown>;
type AnyQueryHandler   = QueryHandler<Query<unknown>, unknown>;

class CommandBusImpl {
  private readonly _handlers = new Map<string, AnyCommandHandler>();

  register<C extends Command<R>, R>(commandType: string, handler: CommandHandler<C, R>): void {
    this._handlers.set(commandType, handler as AnyCommandHandler);
  }

  async execute<R>(command: Command<R>): Promise<R> {
    const handler = this._handlers.get(command._commandType);
    if (!handler) throw new Error(`No handler registered for command "${command._commandType}"`);
    return handler.execute(command) as Promise<R>;
  }
}

class QueryBusImpl {
  private readonly _handlers = new Map<string, AnyQueryHandler>();

  register<Q extends Query<R>, R>(queryType: string, handler: QueryHandler<Q, R>): void {
    this._handlers.set(queryType, handler as AnyQueryHandler);
  }

  async execute<R>(query: Query<R>): Promise<R> {
    const handler = this._handlers.get(query._queryType);
    if (!handler) throw new Error(`No handler registered for query "${query._queryType}"`);
    return handler.handle(query) as Promise<R>;
  }
}

export const CommandBus = new CommandBusImpl();
export const QueryBus   = new QueryBusImpl();

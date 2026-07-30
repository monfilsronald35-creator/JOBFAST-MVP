export interface PaginatedResult<T> {
  items:       T[];
  nextCursor?: string;
  total?:      number;
}

export interface PaginationOptions {
  cursor?: string;
  limit?:  number;
}

// Base repository contract every domain module implements
export interface IRepository<Entity, ID = string, CreateDTO = Partial<Entity>, UpdateDTO = Partial<Entity>> {
  findById(id: ID): Promise<Entity | null>;
  findAll(filter?: Record<string, unknown>, pagination?: PaginationOptions): Promise<PaginatedResult<Entity>>;
  create(dto: CreateDTO): Promise<Entity>;
  update(id: ID, dto: UpdateDTO): Promise<Entity>;
  delete(id: ID): Promise<void>;
  exists(id: ID): Promise<boolean>;
}

export interface QueryConstraint {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
  value: any;
}

export interface OrderByConstraint {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  where?: QueryConstraint[];
  orderBy?: OrderByConstraint[];
  limit?: number;
  offset?: number;
  startAfter?: any;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}

export interface IDatabase {
  get<T>(collection: string, id: string): Promise<T | null>;

  query<T>(collection: string, options: QueryOptions): Promise<T[]>;

  create<T>(collection: string, data: Omit<T, 'id'>, id?: string): Promise<string>;

  update(collection: string, id: string, data: Partial<any>): Promise<void>;

  delete(collection: string, id: string): Promise<void>;

  batch(operations: BatchOperation[]): Promise<void>;

  transaction<T>(callback: (txn: ITransaction) => Promise<T>): Promise<T>;

  onSnapshot<T>(
    collection: string,
    id: string,
    callback: (data: T | null) => void
  ): () => void;

  onQuerySnapshot<T>(
    collection: string,
    options: QueryOptions,
    callback: (data: T[]) => void
  ): () => void;
}

export interface ITransaction {
  get<T>(collection: string, id: string): Promise<T | null>;
  set(collection: string, id: string, data: any): void;
  update(collection: string, id: string, data: Partial<any>): void;
  delete(collection: string, id: string): void;
}

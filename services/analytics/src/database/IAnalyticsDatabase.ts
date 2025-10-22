export interface QueryFilter {
  field: string;
  operator: '==' | '>' | '>=' | '<' | '<=' | 'in';
  value: any;
}

export interface AggregationOptions {
  groupBy?: string[];
  sum?: string[];
  avg?: string[];
  count?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsData {
  date?: string;
  [key: string]: any;
}

export interface IAnalyticsDatabase {
  query<T>(
    collection: string,
    filters: QueryFilter[],
    limit?: number
  ): Promise<T[]>;

  aggregate(
    collection: string,
    options: AggregationOptions
  ): Promise<AnalyticsData[]>;

  writeAnalyticsDoc(collection: string, id: string, data: any): Promise<void>;

  readAnalyticsDoc<T>(collection: string, id: string): Promise<T | null>;
}

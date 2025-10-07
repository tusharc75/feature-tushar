export const OPERATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'distinct', label: 'Distinct' },
  { value: 'standardDeviation', label: 'Standard Deviation' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' }
];

export interface PipelineItem {
  _id: string;
  type: 'lookup' | 'group' | 'sort' | 'limit';
  [key: string]: any;
}

export interface LookupPipeline extends PipelineItem {
  type: 'lookup';
  withResource: string;
  fieldToMatch: Array<{
    localField: string;
    lookupResourceField: string;
  }>;
}

export interface GroupPipeline extends PipelineItem {
  type: 'group';
  fields: string[];
  accumulator: Array<{
    field: string;
    operation: string;
    outputField: string;
  }>;
}

export interface SortPipeline extends PipelineItem {
  type: 'sort';
  sortBy: { [fieldName: string]: 1 | -1 };
}

export interface LimitPipeline extends PipelineItem {
  type: 'limit';
  limit: number;
}
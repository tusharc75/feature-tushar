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

export const getUniqueResources = (pipeline: PipelineItem[], mainResource?: string): string[] => {
  const resources = new Set<string>();

  if (mainResource) {
    resources.add(mainResource);
  }

  pipeline?.forEach((item) => {
    if (item?.type === 'lookup' && item?.withResource) {
      resources.add(item.withResource);
    }
  });

  return Array.from(resources);
};

export const validatePipeline = (pipeline: PipelineItem[]): { [itemId: string]: string[] } => {
  const errors: { [itemId: string]: string[] } = {};

  pipeline?.forEach((item) => {
    const itemErrors: string[] = [];
    switch (item.type) {
      case 'lookup':
        const lookupItem = item as LookupPipeline;
        if (!lookupItem?.withResource) {
          itemErrors.push('withResource_required');
        }
        lookupItem?.fieldToMatch?.forEach((match, index) => {
          if (!match?.localField) {
            itemErrors.push(`localField_${index}_required`);
          }
          if (!match?.lookupResourceField) {
            itemErrors.push(`lookupResourceField_${index}_required`);
          }
        });
        break;

      case 'group':
        const groupItem = item as GroupPipeline;
        if (!groupItem?.fields?.length) {
          itemErrors.push('fields_required');
        }
        if (!groupItem?.accumulator?.length) {
          itemErrors.push('accumulator_required');
        } else {
          groupItem?.accumulator?.forEach((acc, index) => {
            if (!acc?.operation) {
              itemErrors.push(`operation_${index}_required`);
            }
            if (acc?.operation !== 'count' && !acc?.field) {
              itemErrors.push(`field_${index}_required`);
            }
          });
        }
        break;

      case 'sort':
        const sortItem = item as SortPipeline;
        if (!Object.keys(sortItem?.sortBy).length) {
          itemErrors.push('sortBy_required');
        }
        break;

      case 'limit':
        const limitItem = item as LimitPipeline;
        if (!limitItem?.limit || limitItem?.limit < 1) {
          itemErrors.push('limit_required');
        }
        break;
    }
    if (itemErrors.length > 0) {
      errors[item._id] = itemErrors;
    }
  });

  return errors;
};

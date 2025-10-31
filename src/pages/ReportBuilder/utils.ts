import axiosInstance from 'src/axios/axiosInstance';
import { displayDate } from 'src/constants/helpers';

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
  type: 'lookup' | 'group' | 'sort' | 'limit' | 'chart' | 'filter' | 'matrix';
  [key: string]: any;
}

export interface LookupPipeline extends PipelineItem {
  type: 'lookup';
  withResource: string;
  fieldToMatch: Array<{
    localField: string;
    lookupResourceField: string;
  }>;
  fields: string[];
}

export interface GroupPipeline extends PipelineItem {
  type: 'group';
  fields: Array<{
    fieldName: string;
    resource: string;
  }>;
  accumulator: Array<{
    field: string;
    operation: string;
    outputField: string;
  }>;
}

export interface SortPipeline extends PipelineItem {
  type: 'sort';
  fields: Array<{
    fieldName: string;
    order: 1 | -1;
    resource: string;
  }>;
}

export interface LimitPipeline extends PipelineItem {
  type: 'limit';
  limit: number;
}

export interface ChartPipeline extends PipelineItem {
  type: 'chart';
  chartType: 'bar' | 'pie' | 'line';
  xAxis?: {
    field: string;
    label: string;
    resource: string;
  };
  yAxis?: {
    field: string;
    label: string;
    resource: string;
  };
  value?: {
    field: string;
    resource: string;
  };
  label?: {
    field: string;
    resource: string;
  };
}

export interface FilterPipeline extends PipelineItem {
  type: 'filter';
  fields: Array<{
    fieldName: string;
    value: any;
    operation: string;
    type: string;
    resource: string;
  }>;
}

export interface MatrixPipeline extends PipelineItem {
  type: 'matrix';
  rows: Array<{
    fieldName: string;
    resource: string;
  }>;
  columns: Array<{
    fieldName: string;
    resource: string;
  }>;
  values: Array<{
    fieldName: string;
    resource: string;
  }>;
}

export const reportBuilderTypeOptions = [
  { optionLabel: 'Report', optionValue: 'report' },
  { optionLabel: 'KPI', optionValue: 'kpi' }
];

export const chartTypeOptions = [
  { optionLabel: 'Bar', optionValue: 'bar' },
  { optionLabel: 'Pie', optionValue: 'pie' },
  { optionLabel: 'Line', optionValue: 'line' }
];

export const filterOperations = [
  { optionValue: 'is', optionLabel: 'Is' },
  { optionValue: 'isNot', optionLabel: 'Is not' },
  { optionValue: 'contains', optionLabel: 'Contains' },
  { optionValue: 'doesNotContain', optionLabel: 'Does not contain' },
  { optionValue: 'startsWith', optionLabel: 'Starts with' },
  { optionValue: 'endsWith', optionLabel: 'Ends with' },
  { optionValue: 'isEmpty', optionLabel: 'Is empty' },
  { optionValue: 'notEmpty', optionLabel: 'Not empty' }
];

export const dateFilterOperations = [
  { optionValue: 'between', optionLabel: 'Between' },
  { optionValue: 'before', optionLabel: 'Before' },
  { optionValue: 'on', optionLabel: 'On' },
  { optionValue: 'after', optionLabel: 'After' }
];

export const durationLabelMap = {
  '1-year': 'Last 1 Year',
  '6-months': 'Last 6 Months',
  '3-months': 'Last 3 Months',
  '1-month': 'Last 1 Month',
  '1-week': 'Last 1 Week',
  'current-year': 'Current Year',
  'current-month': 'Current Month',
  'current-week': 'Current Week',
  yesterday: 'Yesterday',
  today: 'Today',
  custom: 'Custom'
};

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

export const getChipLabel = (field: any, filter: any, operation: any) => {
  const fieldLabel = field?.fieldLabel || filter?.fieldName;
  const operationLabel = operation?.optionLabel || filter?.operation;

  if (Array.isArray(filter?.value)) {
    const valueText = `${filter?.value?.length} selection(s)`;
    return `${fieldLabel} ${operationLabel} ${valueText}`;
  } else if (filter?.type === 'date') {
    if (filter?.value?.duration && filter?.value?.duration !== 'custom') {
      return `${fieldLabel} ${operationLabel} ${durationLabelMap?.[filter?.value?.duration] || ''}`;
    } else if (filter?.value?.from && filter?.value?.to) {
      const fromDate = displayDate(filter?.value?.from);
      const toDate = displayDate(filter?.value?.to);
      return `${fieldLabel} ${operationLabel} ${fromDate} - ${toDate}`;
    } else if (filter?.value) {
      return `${fieldLabel} ${operationLabel} ${displayDate(filter?.value)}`;
    }
    return `${fieldLabel} ${operationLabel}`;
  } else if (filter?.type === 'checkBox') {
    return `${fieldLabel} ${operationLabel} ${filter?.value === true ? 'Yes' : 'No'}`;
  } else {
    const valueText = filter?.value ? ` ${filter?.value}` : '';
    return `${fieldLabel} ${operationLabel}${valueText}`;
  }
};

export const getAvailableFieldsForPipeline = async (pipeline: PipelineItem[], mainResource: string, fields: any[]): Promise<any[]> => {
  if (fields?.length > 0) {
    const { data } = await axiosInstance().put(`/report-builder/pipeline-fields`, {
      pipeline,
      resource: mainResource,
      fields: fields?.map((field) => field.fieldName)
    });
    return data?.data || [];
  }

  return [];
  // const pipelineBeforeFilter = pipeline.slice(0, currentItemIndex);

  // const idField = {
  //   'fieldName': '_id',
  //   'fieldLabel': '_id',
  //   'resource': mainResource,
  //   'type': 'singleLine'
  // }

  // const lastGroupIndex = pipelineBeforeFilter
  //   .map((item, index) => (item.type === 'group' ? index : -1))
  //   .filter((index) => index !== -1)
  //   .pop();

  // const mainResourceFields = resourceFieldMap[mainResource] || [];
  // const fields: Array<any> = [];

  // if (lastGroupIndex !== undefined) {
  //   const groupItem = pipelineBeforeFilter[lastGroupIndex] as GroupPipeline;

  //   groupItem.fields?.forEach((fieldName) => {
  //     const field = mainResourceFields.find((f) => f.fieldName === fieldName);
  //     if (field) {
  //       fields.push({...field, resource: 'Summaries'});
  //     }
  //   });

  //   groupItem.accumulator?.forEach((acc) => {
  //     const field = mainResourceFields.find((f) => f.fieldName === acc.field);
  //     if (acc.operation === 'count') {
  //       fields.push({
  //         fieldName: 'count',
  //         fieldLabel: acc.outputField || OPERATIONS?.find((op) => op.value === acc.operation)?.label,
  //         resource: 'Summaries'
  //       });
  //     } else {
  //       fields.push({
  //         ...field,
  //         fieldLabel: acc.outputField || OPERATIONS?.find((op) => op.value === acc.operation)?.label,
  //         resource: 'Summaries'
  //       });
  //     }
  //   });

  //   for (let idx = lastGroupIndex + 1; idx < pipelineBeforeFilter?.length; idx++) {
  //     const item = pipelineBeforeFilter[idx];
  //     if (item?.type === 'lookup') {
  //       const lookupItem = item as LookupPipeline;
  //       if (lookupItem?.withResource && lookupItem?.fields && lookupItem?.fields?.length > 0) {
  //         const lookupResourceFields = resourceFieldMap[lookupItem.withResource] || [];
  //         lookupItem?.fields?.forEach((fieldName) => {
  //           const field = lookupResourceFields.find((f) => f.fieldName === fieldName);
  //           if (field) {
  //             fields.push(field);
  //           }
  //         });
  //       }
  //     }
  //   }

  //   return [{...idField, resource: 'Summaries'}, ...fields];
  // }

  // mainResourceFields.forEach((field) => {
  //   fields.push(field);
  // });

  // pipelineBeforeFilter?.forEach((item) => {
  //   if (item?.type === 'lookup') {
  //     const lookupItem = item as LookupPipeline;
  //     if (lookupItem?.withResource && lookupItem?.fields && lookupItem?.fields?.length > 0) {
  //       const lookupResourceFields = resourceFieldMap[lookupItem.withResource] || [];
  //       lookupItem?.fields?.forEach((fieldName) => {
  //         const field = lookupResourceFields.find((f) => f.fieldName === fieldName);
  //         if (field) {
  //           fields.push(field);
  //         }
  //       });
  //     }
  //   }
  // });

  // return [idField, ...fields];
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

        sortItem?.fields?.forEach((field, index) => {
          if (!field?.fieldName) {
            itemErrors.push(`fieldName_${index}_required`);
          }
          if (!field?.order) {
            itemErrors.push(`order_${index}_required`);
          }
        });
        break;

      case 'limit':
        const limitItem = item as LimitPipeline;
        if (!limitItem?.limit || limitItem?.limit < 1) {
          itemErrors.push('limit_required');
        }
        break;

      case 'chart':
        const chartItem = item as ChartPipeline;
        if (!chartItem?.chartType) {
          itemErrors.push('chartType_required');
        }
        if (['bar', 'line'].includes(chartItem?.chartType)) {
          if (!chartItem?.xAxis?.field) {
            itemErrors.push('xAxis_field_required');
          }
          // if (!chartItem?.xAxis?.label) {
          //   itemErrors.push('xAxis_label_required');
          // }
          if (!chartItem?.yAxis?.field) {
            itemErrors.push('yAxis_field_required');
          }
          // if (!chartItem?.yAxis?.label) {
          //   itemErrors.push('yAxis_label_required');
          // }
        }
        if (chartItem?.chartType === 'pie') {
          if (!chartItem?.value) {
            itemErrors.push('value_required');
          }
          if (!chartItem?.label) {
            itemErrors.push('label_required');
          }
        }
        break;
      case 'matrix':
        const matrixItem = item as MatrixPipeline;

        if (!matrixItem?.rows?.length) {
          itemErrors.push('rows_required');
        }
        if (!matrixItem?.columns?.length) {
          itemErrors.push('columns_required');
        }
        if (!matrixItem?.values?.length) {
          itemErrors.push('values_required');
        }
        break;
    }
    if (itemErrors.length > 0) {
      errors[item._id] = itemErrors;
    }
  });

  return errors;
};

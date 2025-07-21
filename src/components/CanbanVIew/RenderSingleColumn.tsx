import React from 'react';
import { Option } from 'src/components/CanbanVIew/types';

// [{"field":"process","term":"New"}]

type RenderSingleColumnProps<D> = {
  onSaveEdit?: (data: { inputField: Record<string, string>; updatedData: any }) => void;
  fetchData: (query: string) => Promise<D>;
  option: Option;
  dependencyArray?: any[];
};

const RenderSingleColumn = <D,>({ fetchData, onSaveEdit, option, dependencyArray = [] }: RenderSingleColumnProps<D>) => {
  return <div>{option.optionLabel}</div>;
};

export default RenderSingleColumn;

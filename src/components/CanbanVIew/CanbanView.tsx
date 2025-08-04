import { CancelToken } from 'axios';
import React, { useEffect, useMemo } from 'react';
import RenderSingleColumn from 'src/components/CanbanVIew/RenderSingleColumn';
import { InitialState } from 'src/components/CanbanVIew/types';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

type CanbanViewProps<D> = {
  onSaveEdit?: (data: { inputField: Record<string, string>; updatedData: any }) => void;
  fetchData: (payload: { column: string; page: number; cancelToken: CancelToken }) => Promise<D[]>;
  dependencyArray?: any[];
} & InitialState;

const CanbanView = ({ columns, pivotColumn, onSaveEdit, fetchData, dependencyArray = [] }: CanbanViewProps<D>) => {
  const options = useMemo(() => {
    return [...(pivotColumn.option || [])].sort((a, b) => a.order - b.order);
  }, [pivotColumn]);

  if (!pivotColumn) {
    return (
      <div className="min-h-[500px] p-4">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </div>
    );
  }

  return (
    <div className="grid auto-cols-[300px] grid-flow-col overflow-x-auto">
      {options?.map((d) => (
        <RenderSingleColumn option={d} onSaveEdit={onSaveEdit} key={d.id} />
      ))}
    </div>
  );
};

export default CanbanView;

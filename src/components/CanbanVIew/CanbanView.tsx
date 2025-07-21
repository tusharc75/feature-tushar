import React, { useEffect, useMemo } from 'react';
import RenderSingleColumn from 'src/components/CanbanVIew/RenderSingleColumn';
import { InitialState } from 'src/components/CanbanVIew/types';
import { CanbanStoreProvider, useCanbanStore } from 'src/components/CanbanVIew/useCanbanStore';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

type CanbanViewProps<D> = {
  onSaveEdit?: (data: { inputField: Record<string, string>; updatedData: any }) => void;
  fetchData: (query: string, column: string) => Promise<D>;
  dependencyArray?: any[];
} & InitialState<D>;

const CanbanViewImpl = <D,>({ columns, pivotColumn, onSaveEdit, fetchData, dependencyArray = [] }: CanbanViewProps<D>) => {
  const [, setStore] = useCanbanStore((state) => state.pivotColumn);

  useEffect(() => {
    setStore({ columns, pivotColumn });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, pivotColumn]);

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
        <RenderSingleColumn fetchData={fetchData} option={d} onSaveEdit={onSaveEdit} key={d.id} />
      ))}
    </div>
  );
};

const CanbanView = <D,>(props: CanbanViewProps<D>) => (
  <CanbanStoreProvider>
    <CanbanViewImpl {...props} />
  </CanbanStoreProvider>
);
export default CanbanView;

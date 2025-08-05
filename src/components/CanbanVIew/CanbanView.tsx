import { useMemo } from 'react';
import RenderSingleColumn from 'src/components/CanbanView/RenderSingleColumn';
import { FetchCanbanData, InitialState, UseCanbanStore } from 'src/components/CanbanView/types';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

type CanbanViewProps<D> = {
  onSaveEdit?: (inputField: Record<string, string>, updatedData: D, shouldFetchData?: boolean) => Promise<void>;
  fetchData: FetchCanbanData<D>;
  dependencyArray?: any[];
  state: UseCanbanStore<D>;
  hideSelection?: boolean;
} & InitialState<D>;

const CanbanView = <D,>({ columns, pivotColumn, onSaveEdit, fetchData, dependencyArray = [], state, hideSelection }: CanbanViewProps<D>) => {
  const options = useMemo(() => {
    return [...(pivotColumn?.option || [])].sort((a, b) => a.order - b.order);
  }, [pivotColumn]);

  if (!pivotColumn) {
    return (
      <div className="min-h-[500px] p-4">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </div>
    );
  }

  return (
    <div className="grid auto-cols-[min(calc(100%-35px),340px)] grid-flow-col gap-4 overflow-x-auto">
      {options?.map((d) => (
        <RenderSingleColumn
          state={state}
          option={d}
          onSaveEdit={onSaveEdit}
          columns={columns}
          key={d.id}
          hideSelection={hideSelection}
          dependencyArray={dependencyArray}
          fetchData={fetchData}
        />
      ))}
    </div>
  );
};

export default CanbanView;

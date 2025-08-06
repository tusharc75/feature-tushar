import { useCallback, useMemo, useState } from 'react';
import RenderSingleColumn from 'src/components/KanbanView/RenderSingleColumn';
import { FetchCanbanData, InitialState, UseCanbanStore } from 'src/components/KanbanView/types';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useDndSensors } from 'src/hooks';
import RenderSingleCard from 'src/components/KanbanView/RenderSingleColumn/RenderSIngleCard';
import KanbanHeader from 'src/components/KanbanView/KanbanHeader';

type KanbanViewProps<D> = {
  onSaveEdit?: (inputField: Record<string, string>, updatedData: D, shouldFetchData?: boolean) => Promise<void>;
  fetchData: FetchCanbanData<D>;
  dependencyArray?: any[];
  state: UseCanbanStore<D>;
  hideSelection?: boolean;
  renderedFrom: string;
  resource: string;
} & InitialState<D>;

const KanbanView = <D,>({
  columns,
  pivotColumn,
  onSaveEdit,
  fetchData,
  dependencyArray = [],
  state,
  hideSelection,
  renderedFrom,
  resource
}: KanbanViewProps<D>) => {
  const options = useMemo(() => {
    return [...(pivotColumn?.option || [])].sort((a, b) => a.order - b.order);
  }, [pivotColumn]);
  const [activeDragItemProps, setActiveDragItemProps] = useState<any>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const sendRefreshSignal = useCallback(() => {
    setRefreshSignal((prev) => (prev > 10 ? 0 : (prev += 1)));
  }, []);

  const sensors = useDndSensors();

  if (!pivotColumn) {
    return (
      <div className="min-h-[500px] p-4">
        <CommonSkeleton lenArray={[...Array(10).keys()]} />
      </div>
    );
  }

  return (
    <>
      <KanbanHeader sendRefreshSignal={sendRefreshSignal} pivotColumn={pivotColumn} state={state} renderedFrom={renderedFrom} resource={resource} />
      <DndContext sensors={sensors} onDragStart={console.log}>
        <div className="grid auto-cols-[min(calc(100%-35px),340px)] grid-flow-col gap-4 overflow-x-auto">
          {options?.map((d) => (
            <RenderSingleColumn
              refreshSignal={refreshSignal}
              state={state}
              option={d}
              onSaveEdit={onSaveEdit}
              columns={columns}
              key={d.id}
              hideSelection={hideSelection}
              dependencyArray={dependencyArray}
              fetchData={fetchData}
              setActiveDragItemProps={setActiveDragItemProps}
              pivotColumn={pivotColumn}
            />
          ))}
        </div>
        <DragOverlay>{activeDragItemProps && <RenderSingleCard {...activeDragItemProps} dragging={true} />}</DragOverlay>
      </DndContext>
    </>
  );
};

export default KanbanView;

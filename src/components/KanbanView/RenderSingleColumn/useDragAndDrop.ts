import { useDndMonitor, useDroppable } from '@dnd-kit/core';
import { CancelToken } from 'axios';
import React from 'react';
import { Column, Option } from 'src/components/KanbanView/types';

let sourceCallback: () => Promise<void> = () => new Promise((resove) => resove());

const useDragAndDrop = <D>({
  setActiveDragItemProps,
  option,
  handleSaveEditWrapper,
  pivotColumn,
  handleFetchData,
  disabled = false
}: {
  setActiveDragItemProps: React.Dispatch<any>;
  option: Option;
  handleSaveEditWrapper: (props: { inputField: Record<string, string>; updatedData: any }) => Promise<void>;
  pivotColumn: Column<D>;
  handleFetchData: (props: { page: number; cancelToken?: CancelToken }) => Promise<void>;
  disabled?: boolean;
}) => {
  const droppableProps = useDroppable({
    id: option.optionValue,
    disabled,
    data: {
      type: 'Column',
      column: option.optionValue
    }
  });

  useDndMonitor({
    onDragStart(event) {
      setActiveDragItemProps(event.active.data.current?.props);
      if (!event.active) return;
      const { active } = event;
      if (active.data.current.columnId === option.optionValue) {
        sourceCallback = () => handleFetchData({ page: 0 });
      }
    },

    async onDragEnd(event) {
      setActiveDragItemProps(null);
      if (!event.over) return;
      const { active, over } = event;

      if (active.data.current?.columnId === over.id) return;

      if (over.id !== option.optionValue) return;
      const targetColumn = over.data.current.column;
      if (!targetColumn) return;
      const inputField = {
        [pivotColumn.id || pivotColumn.accessor]: targetColumn
      };
      const updatedData = {
        ...active.data.current.props.data,
        [pivotColumn.id || pivotColumn.accessor]: targetColumn
      };
      await handleSaveEditWrapper({ inputField, updatedData });
      await sourceCallback();

      sourceCallback = () => new Promise((resove) => resove());
    }
  });

  return droppableProps;
};

export default useDragAndDrop;

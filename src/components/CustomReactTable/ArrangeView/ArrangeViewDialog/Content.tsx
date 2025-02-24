import { DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Close, DragIndicator } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { startCase } from 'lodash';
import { memo, useCallback, useMemo } from 'react';
import { ToggleSidebar } from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog/Sidebar';
import { ContentProps, RenderListItemProps } from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog/types';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { cn } from 'src/constants/helpers';
import { useDndSensors } from 'src/hooks';

const Content = memo(({ state, values, setFieldValue }: ContentProps) => {
  const sensors = useDndSensors();
  const { sortedColumns, isSidebarOpen, activeItem, setIsSidebarOpen, onDragEnd, onDragStart, isMobile, toggleSidebar } = state;

  const visibleColumnsMap = useMemo(
    () =>
      sortedColumns.reduce((acc, curr) => {
        const key = curr.id ?? curr.accessor;
        acc[key] = !values.hide.includes(key);
        return acc;
      }, {}),

    [sortedColumns, values.hide]
  );

  const handleRemoveItem = useCallback(
    (colName: string) => {
      setFieldValue('hide', [...new Set([...values.hide, colName])]);
    },
    [setFieldValue, values.hide]
  );

  return (
    <div
      className={cn(
        'relative h-[--container-max-h] flex-grow  px-[17px] py-[15px] pt-0 [--py:15px]',
        isMobile && isSidebarOpen ? 'overflow-hidden' : 'overflow-y-auto'
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-[--dark-primary,white] py-[16px]">
        <div className="flex items-center">
          {isMobile && <ToggleSidebar toggleSidebar={toggleSidebar} />}
          <h6 className="text-base font-medium leading-[19px]">Customize Columns</h6>
        </div>
        <p className="hidden text-sm leading-4 text-gray-300 dark:text-gray-600 md:block">(Drag to reorder)</p>
      </div>
      <DndContext onDragEnd={(e) => onDragEnd(e, setFieldValue)} modifiers={[restrictToVerticalAxis]} onDragStart={onDragStart} sensors={sensors}>
        <SortableContext items={sortedColumns.map((c) => c.accessor)} strategy={verticalListSortingStrategy}>
          <ul className="list-none space-y-2">
            {sortedColumns.map((column, index) => {
              const key = column.id ?? column.accessor;
              return (
                <RenderListItem
                  key={column.accessor}
                  column={column}
                  index={index}
                  handleRemoveItem={handleRemoveItem}
                  hidden={!visibleColumnsMap[key]}
                />
              );
            })}
          </ul>
        </SortableContext>
        <DragOverlay>
          {activeItem && (
            <span className="[&_.MuiListItemIcon-root]:!cursor-grabbing">
              <RenderListItem {...activeItem} />
            </span>
          )}
        </DragOverlay>
      </DndContext>
      <div
        onClick={() => setIsSidebarOpen(false)}
        title={isMobile && isSidebarOpen ? 'Close Sidebar' : ''}
        className={cn(
          'absolute inset-0 cursor-pointer bg-black/50 [backdrop-filter:blur(3px)] [transition:opacity_300ms,_backdrop-filter_300ms] ',
          isMobile && isSidebarOpen ? 'z-10 opacity-100' : '-z-10 opacity-0'
        )}
      />
    </div>
  );
});

export default Content;

const RenderListItem = memo(
  ({ column, index, handleRemoveItem = () => {}, hidden }: RenderListItemProps) => {
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
      id: column.accessor,
      data: {
        type: 'Column',
        index,
        props: { column, index, hidden }
      },
      disabled: column.lockPosition || hidden
    });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition
    };

    const key = column.id ?? column.accessor;

    return (
      <li
        ref={setNodeRef}
        style={style}
        className={cn(
          `list-none`,
          isDragging ? ' bg-[var(--dark-secondary,theme("colors.blue.200"))] ' : 'bg-[var(--dark-secondary,#fff)]',
          hidden ? 'mb-0 mt-0 h-0 overflow-hidden' : 'flex items-center rounded-md  border p-[6px_10px]  transition-colors'
        )}
      >
        {!hidden && (
          <>
            <div className="flex flex-grow items-center gap-1">
              <HtmlTooltip title={column.lockPosition ? 'Locked' : ''}>
                <IconButton
                  {...attributes}
                  {...listeners}
                  disabled={column.lockPosition}
                  className={cn(`pl-2`, column.lockPosition ? '' : '!cursor-grab ', isDragging ? '!cursor-grabbing' : '')}
                  sx={{ borderRadius: 2 }}
                  size="small"
                >
                  <DragIndicator fontSize="small" />
                </IconButton>
              </HtmlTooltip>
              <h6 className={cn('line-clamp-1 select-none text-sm font-medium leading-4', column.lockPosition ? 'text-gray-500' : '')} id={key}>
                {column.Header || startCase(key)}
              </h6>
            </div>
            <IconButton disabled={column.disabled} sx={{ ml: 'auto' }} size="small" onClick={() => handleRemoveItem(key)}>
              <Close fontSize="small" />
            </IconButton>
          </>
        )}
      </li>
    );
  },
  (prev, next) =>
    prev.column.id === next.column.id && prev.index === next.index && prev.hidden === next.hidden && prev.handleRemoveItem === next.handleRemoveItem
);

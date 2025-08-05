import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, Collapse, IconButton } from '@mui/material';
import { memo, useState } from 'react';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import RenderCanbanCell from 'src/components/KanbanView/RenderSingleColumn/RenderKanbanCell';
import { Column, UseCanbanStore } from 'src/components/KanbanView/types';
import { cn } from 'src/constants/helpers';

type RenderSingleCardProps<D> = {
  data: D;
  state: UseCanbanStore<D>;
  actionColumn: Column<D> | undefined;
  indexColumn: Column<D> | undefined;
  primaryColumn: Column<D> | undefined;
  displayedColumns: Column<D>[];
  hiddenColumns: Column<D>[];
  onSaveEdit?: (props: { inputField: Record<string, string>; updatedData: any }) => Promise<void>;
  hideSelection?: boolean;
  setActiveDragItemProps: React.Dispatch<any>;
  columnId: string;
  dragging?: boolean;
};

const RenderSingleCardImpl = <D,>({
  data,
  primaryColumn,
  actionColumn,
  displayedColumns,
  hiddenColumns,
  indexColumn,
  state,
  onSaveEdit,
  hideSelection,
  columnId,
  dragging
}: RenderSingleCardProps<D>) => {
  const [expanded, setExpanded] = useState(false);

  const canEdit = data?.hasOwnProperty('canEdit') ? data['canEdit'] : true;

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: data?.['_id'],
    disabled: !data || !canEdit,
    data: {
      columnId,
      props: {
        data,
        primaryColumn,
        actionColumn,
        displayedColumns,
        hiddenColumns,
        indexColumn,
        state,
        onSaveEdit,
        hideSelection
      }
    }
  });

  const styleDnd = {
    transform: CSS.Translate.toString(transform)
  };

  if (!data) return null;

  return (
    <div
      ref={setNodeRef}
      style={styleDnd}
      {...attributes}
      {...listeners}
      className={cn(
        'mx-2 mb-2 rounded-md bg-[var(--dark-primary,white)] [&_.show-in-export]:!hidden',
        dragging ? 'cursor-grabbing' : canEdit ? 'cursor-grab' : '',
        canEdit ? '' : 'bg-red-100 dark:bg-red-900'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b p-2 pb-0">
        <div className="flex items-center">
          {!hideSelection && (
            <span className="block">
              <Checkbox
                icon={<RadioButtonUnchecked />}
                sx={{ p: '5px' }}
                size="small"
                checkedIcon={<CheckCircle />}
                onChange={(event) => {
                  state.handleSelect(data);
                }}
                checked={state.selectedRrowsMap.has(data['_id'])}
              />
            </span>
          )}
          {indexColumn && <RenderCanbanCell column={indexColumn} data={data} onSaveEdit={onSaveEdit} hideHeader />}
          <RenderCanbanCell column={primaryColumn} data={data} onSaveEdit={onSaveEdit} />
        </div>
        <div className="flex items-center">
          {actionColumn && <RenderCanbanCell column={actionColumn} data={data} onSaveEdit={onSaveEdit} hideHeader />}
          {hiddenColumns.length > 0 && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((prev) => !prev);
              }}
            >
              {expanded ? <BsChevronExpand /> : <BsChevronContract />}
            </IconButton>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 pt-0">
        <ul className=" list-none space-y-2">
          {displayedColumns?.map((d, i) => {
            return (
              <li key={d.accessor} className="list-none">
                <RenderCanbanCell column={d} data={data} key={d.accessor} onSaveEdit={onSaveEdit} />
              </li>
            );
          })}
        </ul>
        {hiddenColumns.length > 0 && (
          <Collapse unmountOnExit in={expanded}>
            <div className=" space-y-2">
              {hiddenColumns?.map((d, i) => {
                if (i === 0) return null;
                return (
                  <li key={d.accessor} className="list-none">
                    <RenderCanbanCell column={d} data={data} key={d.accessor} onSaveEdit={onSaveEdit} />
                  </li>
                );
              })}
            </div>
          </Collapse>
        )}
      </div>
    </div>
  );
};

const RenderSingleCard = memo(RenderSingleCardImpl) as typeof RenderSingleCardImpl;

export default RenderSingleCard;

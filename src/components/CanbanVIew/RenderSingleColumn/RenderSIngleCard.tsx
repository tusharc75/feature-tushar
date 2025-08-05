import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { Checkbox, Collapse, IconButton } from '@mui/material';
import { memo, useState } from 'react';
import { BsChevronContract, BsChevronExpand } from 'react-icons/bs';
import RenderCanbanCell from 'src/components/CanbanView/RenderSingleColumn/RenderCanbanCell';
import { Column, UseCanbanStore } from 'src/components/CanbanView/types';

type RenderSingleCardProps<D> = {
  data: D;
  state: UseCanbanStore<D>;
  actionColumn: Column<D> | undefined;
  indexColumn: Column<D> | undefined;
  primaryColumn: Column<D> | undefined;
  displayedColumns: Column<D>[];
  hiddenColumns: Column<D>[];
  onSaveEdit?: (inputField: Record<string, string>, updatedData: any) => void;
  hideSelection?: boolean;
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
  hideSelection
}: RenderSingleCardProps<D>) => {
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  return (
    <div className="mx-2 mb-2 rounded-md bg-[var(--dark-primary,white)] [&_.show-in-export]:!hidden">
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
        {displayedColumns?.map((d, i) => {
          return <RenderCanbanCell column={d} data={data} key={d.accessor} onSaveEdit={onSaveEdit} />;
        })}
        {hiddenColumns.length > 0 && (
          <Collapse unmountOnExit in={expanded}>
            {hiddenColumns?.map((d, i) => {
              if (i === 0) return null;
              return <RenderCanbanCell column={d} data={data} key={d.accessor} onSaveEdit={onSaveEdit} />;
            })}
          </Collapse>
        )}
      </div>
    </div>
  );
};

const RenderSingleCard = memo(RenderSingleCardImpl) as typeof RenderSingleCardImpl;

export default RenderSingleCard;

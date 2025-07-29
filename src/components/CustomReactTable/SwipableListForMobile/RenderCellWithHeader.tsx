import { Edit } from '@mui/icons-material';
import { flexRender } from '@tanstack/react-table';
import { memo, useMemo, useState } from 'react';
import { RenderInputs, TColType } from '../TableComponents/TableHelperComponents';

const RenderCellWithHeader = memo(
  ({ field, row, submitInput, currentlyEditingCells, setCurrentlyEditingCells }: any) => {
    const [isEditing, setIsEditing] = useState(false);
    const cell = row?.getVisibleCells()?.find((cell: any) => cell?.column?.id === field?.id);

    const columnDef: TColType = cell?.column?.columnDef as TColType;

    const handleStopEditing = () => {
      currentlyEditingCells.delete(cell?.column?.id);
      setCurrentlyEditingCells(new Set(currentlyEditingCells));
      setIsEditing(false);
    };

    const props = useMemo(
      () => ({
        id: cell?.id,
        key: cell?.id,
        className: `text-[12px_!important] [&>*]:[font-size:12px_!important] [&>div]:[flex-wrap:wrap_!important] [&_*]:!font-semibold [&_*]:[white-space:unset_!important] [&_h5]:[font-size:12px_!important]`,
        onClick: () => {
          if (!cell?.column?.id || !row?.original?._id || !cell?.column?.columnDef?.editable || cell?.column?.id === 'selection') return;
          setIsEditing(true);

          setCurrentlyEditingCells((prev) => new Set([...prev, cell?.column?.id]));
        }
      }),
      [cell, row.original, setCurrentlyEditingCells]
    );

    if (!cell) return null;

    switch (true) {
      case !['selection'].includes(cell?.column?.id) && isEditing:
        return (
          <h6 className=" grid max-w-full text-[12px]">
            <span className="text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">{field?.header}: </span>
            <span {...props}>
              {' '}
              <div className="w-full">
                <RenderInputs cell={cell} columnDef={columnDef} handleStopEditing={handleStopEditing} row={row} submitInput={submitInput} />
              </div>
            </span>
          </h6>
        );
      case columnDef?.editable:
        return (
          <h6 className=" grid max-w-full text-[12px]">
            <span className="text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">{field.header}: </span>
            <span {...props}>
              <div className="w-fit">
                <div className=" ml-auto max-w-[max-content] cursor-pointer justify-end gap-[20px] [border-bottom:1px_dashed_#8a8a8a] [display:flex_!important]">
                  <p>{flexRender(cell?.column?.columnDef?.cell, cell?.getContext())}</p>
                  <span>
                    <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
                  </span>
                </div>
              </div>
            </span>
          </h6>
        );
      default:
        return (
          <h6 className=" grid max-w-full text-[12px]">
            <span className="text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">{field.header}: </span>
            <span {...props}>{flexRender(cell?.column?.columnDef?.cell, cell?.getContext())}</span>
          </h6>
        );
    }
  }
);

export default RenderCellWithHeader;

import { Edit } from '@mui/icons-material';
import { memo, useMemo, useState } from 'react';
import { Column } from 'src/components/CanbanView/types';
import { RenderInputs } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { cn } from 'src/constants/helpers';

const defaultHeaderClass = 'text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]';

const RenderCanbanCellImpl = <D,>({
  column,
  data,
  onSaveEdit,
  hideHeader = false,
  headerClassName = '',
  cellClassname = ''
}: {
  column: Column<D>;
  data: D;
  onSaveEdit?: (inputField: Record<string, string>, updatedData: any) => void;
  hideHeader?: boolean;
  headerClassName?: string;
  cellClassname?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const rowObject = {
    row: {
      original: data
    },
    column: {
      id: column.id || column.accessor,
      columnDef: column
    }
  };
  const cell = {
    column: {
      id: column.id || column.accessor,
      columnDef: column
    },
    row: {
      original: data
    }
  };
  let renderedCell = <></>;
  let renderedHead = <></>;

  const header = column.Header || column.header;
  const cellRenderer = column.cell || column.Cell;

  const isEditable = !!column?.id && !!data['_id'] && column.editable && column?.id !== 'selection';

  if (typeof cellRenderer === 'function') {
    renderedCell = cellRenderer(rowObject as any);
  } else if (typeof cellRenderer === 'string') {
    renderedCell = <>{cellRenderer}</>;
  }

  if (typeof header === 'string') {
    renderedHead = <>{header}</>;
  } else if (typeof header === 'function') {
    renderedHead = header({ column: { columnDef: column } as any, header: undefined, table: undefined });
  }

  const handleStopEditing = () => {
    setIsEditing(false);
  };

  const props = useMemo(
    () => ({
      id: column?.id,
      key: column?.id,
      className: cn(
        '!text-[12px] [&>*]:!text-[12px] [&_span]:!text-[12px] [&_p]:!text-[12px] [&_*]:!font-medium',
        `[&_*]:[white-space:unset_!important] [&_h5]:[font-size:12px_!important]`,
        hideHeader ? 'flex-shrink-0 flex-nowrap flex' : ' line-clamp-1 [&>div]:[flex-wrap:wrap_!important]'
      ),
      onClick: () => {
        if (!isEditable) return;
        setIsEditing(true);
      }
    }),
    [column?.id, hideHeader, isEditable]
  );

  const combinedHeaderClass = cn(defaultHeaderClass, headerClassName);

  switch (true) {
    case !['selection'].includes(column?.id) && isEditing:
      return (
        <h6 className=" grid max-w-full text-[12px]">
          {!hideHeader && <span className={combinedHeaderClass}>{renderedHead}: </span>}
          <span {...props}>
            <div className="w-full">
              <RenderInputs cell={cell} columnDef={column} handleStopEditing={handleStopEditing} row={data} submitInput={onSaveEdit} />
            </div>
          </span>
        </h6>
      );
    case isEditable:
      return (
        <h6 className=" grid max-w-full !text-[12px]">
          {!hideHeader && <span className={combinedHeaderClass}>{renderedHead}: </span>}
          <span {...props}>
            <div className="w-fit">
              <div className=" ml-auto max-w-[max-content] cursor-pointer justify-end gap-[20px] [border-bottom:1px_dashed_#8a8a8a] [display:flex_!important]">
                <p className="line-clamp-1">{renderedCell}</p>
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
        <h6 className=" grid max-w-full !text-[12px]">
          {!hideHeader && <span className={combinedHeaderClass}>{renderedHead}: </span>}
          <span {...props}>{renderedCell}</span>
        </h6>
      );
  }
};

const RenderCanbanCell = memo(RenderCanbanCellImpl) as typeof RenderCanbanCellImpl;

export default RenderCanbanCell;

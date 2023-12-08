import { IconButton } from '@material-ui/core';
import { useMemo } from 'react';
import { FaAngleDown, FaAngleRight } from 'react-icons/fa';
import { IndeterminateCheckbox, TColType } from '../TableComponents/TableHelperComponents';
import { childrenProperty, insertChildRowIntoTable } from '../utils';

export const useCreateColumns = ({ columns, expander, fetchChildAttachment, hideSelection, dispatch, state }) => {
  const { dataRows: allRows } = state;

  const fetchChildAttachmentWrapper = async (row) => {
    if (!fetchChildAttachment || row.original[childrenProperty]?.length > 0) return;
    try {
      const subRows = await fetchChildAttachment(row.original.id);
      if (!subRows) return;
      insertChildRowIntoTable({ existingRows: allRows, subRowsToInsert: subRows, parentId: row.original.id, dispatch });
      row.toggleExpanded((data) => !data);
    } catch (error) {
      console.error(error);
    }
  };

  const expanderColumn = useMemo(() => {
    return {
      id: 'expander',
      enableResizing: false,
      header: ({ table }) => (
        <IconButton
          size="small"
          // style={{ marginLeft: '-5px' }}
          {...{
            onClick: table.getToggleAllRowsExpandedHandler()
          }}
        >
          {table.getIsAllRowsExpanded() ? (
            <FaAngleDown className="cursor-pointer text-[var(--primary-text)]" />
          ) : (
            <FaAngleRight className="cursor-pointer text-[var(--primary-text)]" />
          )}
        </IconButton>
      ),
      sticky: 'left',
      size: 70,
      maxSize: 70,
      disableFilters: true,
      disableSortBy: true,
      filterFn: null,
      sortingFn: null,
      canDrag: false,
      cell: ({ row }) => (
        <div
          style={{
            marginLeft: `${row.depth * 15}px`
          }}
        >
          {row.original.type === 'folder' || row.getCanExpand() ? (
            <IconButton
              size="small"
              style={{ fontSize: 13 }}
              onClick={async () => {
                row.getToggleExpandedHandler()();
                fetchChildAttachmentWrapper(row);
              }}
            >
              {row.getIsExpanded() || row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
            </IconButton>
          ) : null}
        </div>
      )
    };
  }, [allRows.length > 0]);

  const selectionColumn = useMemo(
    () => ({
      id: 'selection',
      enableResizing: false,
      size: 50,
      minSize: 50,
      maxSize: 50,
      minWidth: 50,
      width: 50,
      sticky: 'left',
      maxWidth: 50,
      disableFilters: true,
      disableSortBy: true,
      filterFn: null,
      sortingFn: null,
      canDrag: false,
      header: ({ table }) => (
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler()
          }}
          className="mx-auto text-center [&_svg]:[font-size:20px] "
        />
      ),
      cell: ({ row }) => (
        <div className="mx-auto text-center justify-center">
          {row.original.hideSelection ? (
            <></>
          ) : (
            <IndeterminateCheckbox
              {...{
                checked: row.getIsSelected(),
                indeterminate: row.getIsSomeSelected(),
                onChange: row.getToggleSelectedHandler()
              }}
              className="[&_svg]:[font-size:20px_!important]"
            />
          )}
        </div>
      )
    }),
    []
  );
  const newColumns: TColType[] = useMemo(() => {
    const updatedColumn = [];
    if (expander) {
      updatedColumn.push(expanderColumn);
    }
    if (!hideSelection) {
      updatedColumn.push(selectionColumn);
    }
    for (let i = 0; i < columns.length; i++) {
      const e = { ...columns[i] };

      e.id = e.id ?? e.accessor;
      e.cell = e.cell ?? e.Cell;
      e.header = e.header ?? e.Header;
      e.size = e.size ?? e.width;
      switch (true) {
        case e.accessor === 'action':
          e.disableFilters = true;
          e.disableSortBy = true;
          e.canDrag = false;
          e.maxSize = e.maxWidth ?? 120;
          e.size = e.width ?? 120;
          e.enableResizing = false;
          e.id = 'action';
          e.cell = e.Cell;
          e.header = e.Header;
          break;
        case e.accessor === 'index':
          e.disableFilters = e.disableFilters ?? true;
          e.disableSortBy = e.disableSortBy ?? true;
          e.enableResizing = false;
          break;
      }
      updatedColumn.push(e);
    }
    return updatedColumn;
  }, [columns, expander, expanderColumn, selectionColumn, hideSelection]);

  return newColumns;
};

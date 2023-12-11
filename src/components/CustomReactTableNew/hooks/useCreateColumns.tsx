import { IconButton } from '@material-ui/core';
import { useMemo } from 'react';
import { FaAngleDown, FaAngleRight } from 'react-icons/fa';
import { IndeterminateCheckbox, TColType } from '../TableComponents/TableHelperComponents';
import { childrenProperty, insertChildRowIntoTable } from '../utils';
import { fuzzySort } from '../ReactTableHelpers';

export const useCreateColumns = ({ columns, expander, fetchChildAttachment, hideSelection, hideAction, dispatch, state, isClientSideGrid }) => {
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

    columns?.filter((e) => e.accessor !== 'action')?.forEach((ele) => {
      const e = { ...ele };
      e.id = e.id ?? e.accessor;
      e.cell = e.cell ?? e.Cell;
      e.header = e.header ?? e.Header;
      if (e.disableFilters || e.id === 'index') {
        e.accessorKey = undefined;
      } else {
        e.accessorKey = e.accessor ?? e.id;
      }
      e.size = e.size ?? e.width;
      switch (true) {
        case e.accessor === 'index':
          e.disableFilters = e.disableFilters ?? true;
          e.disableSortBy = e.disableSortBy ?? true;
          e.enableResizing = false;
          break;
        case e.disableFilters !== true && isClientSideGrid:
          e.filterFn = 'fuzzy';
          break;
        case e.disableSortBy !== true && isClientSideGrid:
          e.sortingFn = fuzzySort;
          break;
      }
      updatedColumn.push(e);
    })

    const actionColumn = columns?.find((e) => e.accessor === 'action')
    if (!hideAction && actionColumn) {
      updatedColumn.push({
        ...actionColumn,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        maxSize: actionColumn?.maxWidth ?? 120,
        size: actionColumn?.width ?? 120,
        enableResizing: false,
        id: 'action',
        cell: actionColumn?.Cell,
        header: actionColumn?.Header,
      });
    }

    return updatedColumn;
  }, [columns, expander, expanderColumn, selectionColumn, hideSelection]);

  return newColumns;
};

import { IconButton, useMediaQuery } from '@mui/material';
import { useCallback, useMemo } from 'react';
import { FaAngleDown, FaAngleRight } from 'react-icons/fa';
import { IndeterminateCheckbox, TColType } from '../TableComponents/TableHelperComponents';
import { childrenProperty, insertChildRowIntoTable } from '../utils';
import { fuzzySort, serverSort } from '../ReactTableHelpers';

export const useCreateColumns = ({
  columns,
  expander,
  fetchChildAttachment,
  hideSelection,
  hideAction,
  dispatch,
  isClientSideGrid,
  toggleExpandChange,
  resource,
  state,
  renderedFrom,
  expanderWithCustomContent
}) => {
  const { dataRows: allRows, customExpanderRowData } = state;
  const isMobile = useMediaQuery('(max-width:768px)');

  const handleToggleAllCustomExpnader = useCallback(() => {
    if (customExpanderRowData !== 'all') {
      dispatch({ type: 'setCustomExpanderRowData', data: 'all' });
    } else {
      dispatch({ type: 'setCustomExpanderRowData', data: null });
    }
  }, [customExpanderRowData, dispatch]);

  const handleToggleSingleCustomExpnader = useCallback(
    (rowid) => {
      if (!customExpanderRowData) {
        dispatch({ type: 'setCustomExpanderRowData', data: { [rowid]: true } });
      } else if (customExpanderRowData === 'all') {
        dispatch({ type: 'setCustomExpanderRowData', data: null });
      } else if (customExpanderRowData[rowid]) {
        const newData = { ...customExpanderRowData };
        delete newData[rowid];
        if (Object.keys(newData).length === 0) {
          dispatch({ type: 'setCustomExpanderRowData', data: null });
          return;
        } else {
          dispatch({ type: 'setCustomExpanderRowData', data: newData });
        }
      } else {
        dispatch({ type: 'setCustomExpanderRowData', data: { ...customExpanderRowData, [rowid]: true } });
      }
    },
    [customExpanderRowData, dispatch]
  );

  const isAllCustomExpanderExpanded = useMemo(() => customExpanderRowData === 'all', [customExpanderRowData]);
  const isSingleCustomExpanderExpanded = useCallback(
    (rowid) => customExpanderRowData?.[rowid] || isAllCustomExpanderExpanded,
    [customExpanderRowData, isAllCustomExpanderExpanded]
  );

  const newColumns: TColType[] = useMemo(() => {
    const updatedColumn = [];
    if (expanderWithCustomContent) {
      updatedColumn.push(
        expanderColumnWithCustomComponent({
          handleToggleAllCustomExpnader,
          handleToggleSingleCustomExpnader,
          isAllCustomExpanderExpanded,
          isSingleCustomExpanderExpanded
        })
      );
    }
    if (expander) {
      updatedColumn.push(expanderColumn({ fetchChildAttachment, isMobile, fetchChildAttachmentWrapper, toggleExpandChange, allRows, dispatch }));
    }
    if (!hideSelection) {
      updatedColumn.push(selectionColumn({ resource, renderedFrom }));
    }

    columns
      ?.filter((e) => e.accessor !== 'action')
      ?.forEach((ele) => {
        const e = { ...ele };
        e.id = e.id ?? e.accessor;
        e.cell = e.cell ?? e.Cell;
        e.header = e.header ?? e.Header;
        e.customContentExpanded = false;

        e.maxSize = e.maxSize ?? e.maxWidth;
        e.size = e.size || e.width || 200;
        e.width = e.width || e.size || 200;
        e.footer = e.footer ?? e.Footer;

        if (e.disableSortBy !== true && isClientSideGrid) {
          e.sortingFn = fuzzySort;
          e.sortable = true;
        }
        if (e.disableSortBy !== true && !isClientSideGrid) {
          e.sortingFn = serverSort;
          e.sortable = true;
        }

        if (e.disableFilters !== true && isClientSideGrid) {
          e.filterFn = 'fuzzy';
        }

        // e.accessorKey = e.accessor ?? e.id;
        if (!isClientSideGrid) {
          // for serverside, if no data found width accessorKey from row data. Sorting function will not work properly in table.
          e.accessorKey = '_id';
        } else {
          // and for client side accessorKey has to be exact to sort rows.
          e.accessorKey = e.accessor ?? e.id;
        }

        switch (true) {
          case e.accessor === 'index':
            e.disableFilters = e.disableFilters ?? true;
            e.disableSortBy = e.disableSortBy ?? true;
            e.enableResizing = false;
            break;
        }
        updatedColumn.push(e);
      });

    const actionColumn = columns?.find((e) => e.accessor === 'action');
    if (!hideAction && actionColumn) {
      updatedColumn.push({
        ...actionColumn,
        disableFilters: true,
        disableSortBy: true,
        canDrag: false,
        footer: actionColumn?.footer ?? actionColumn.Footer,
        maxSize: actionColumn.maxSize ?? (actionColumn.maxWidth || actionColumn.width || 120),
        size: actionColumn.size ?? (actionColumn.width || 120),
        minSize: actionColumn.minSize ?? (actionColumn.minWidth || 120),
        enableResizing: false,
        id: 'action',
        cell: actionColumn?.Cell,
        header: actionColumn?.Header
      });
    }

    return updatedColumn;
  }, [
    columns,
    expander,
    hideSelection,
    handleToggleAllCustomExpnader,
    handleToggleSingleCustomExpnader,
    isAllCustomExpanderExpanded,
    isSingleCustomExpanderExpanded
  ]);

  return newColumns;
};

const selectionColumn = ({ resource, renderedFrom }) => ({
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
  header: ({ table, ...rest }) => {
    return (
      <IndeterminateCheckbox
        {...{
          checked: table.getIsAllRowsSelected() ? true : false,
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
          id: `${(resource || renderedFrom).split(' ').join('-')}-table-select-all-checkbox`
        }}
        className="mx-auto text-center [&_svg]:[font-size:20px] "
      />
    );
  },
  cell: ({ row }) => (
    <div className="mx-auto justify-center text-center" key={`${(resource || renderedFrom).split(' ').join('-')}-table-checkbox-${row.index || 0}`}>
      {row.original.hideSelection ? (
        <></>
      ) : (
        <IndeterminateCheckbox
          {...{
            checked: row.getIsSelected() ? true : false,
            value: row.getIsSelected() ? true : false,
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
            id: `${(resource || renderedFrom).split(' ').join('-')}-table-checkbox-${row.index || 0}`
          }}
          className="[&_svg]:[font-size:20px_!important]"
        />
      )}
    </div>
  )
});

const expanderColumn = ({ fetchChildAttachment, isMobile, fetchChildAttachmentWrapper, toggleExpandChange, dispatch, allRows }) => ({
  id: 'expander',
  enableResizing: false,
  header: ({ table }) =>
    typeof fetchChildAttachment === 'function' ? null : (
      <IconButton
        size="small"
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
  minSize: 70,
  maxSize: 70,
  minWidth: 70,
  width: 70,
  maxWidth: 70,
  disableFilters: true,
  disableSortBy: true,
  filterFn: null,
  sortingFn: null,
  canDrag: false,
  cell: ({ row }) => (
    <div
      style={{
        marginLeft: isMobile ? 0 : `${row.depth * 15}px`
      }}
    >
      {row.original.canExpand === true || row.getCanExpand() ? (
        <IconButton
          size="small"
          style={{ fontSize: 13 }}
          onClick={async () => {
            row.getToggleExpandedHandler()();
            fetchChildAttachmentWrapper({ row, fetchChildAttachment, dispatch, allRows });
            toggleExpandChange();
          }}
        >
          {row.getIsExpanded() || row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
        </IconButton>
      ) : null}
    </div>
  )
});

const expanderColumnWithCustomComponent = ({
  handleToggleAllCustomExpnader,
  handleToggleSingleCustomExpnader,
  isAllCustomExpanderExpanded,
  isSingleCustomExpanderExpanded
}) => ({
  id: 'expander',
  enableResizing: false,
  header: () => (
    <IconButton size="small" onClick={() => handleToggleAllCustomExpnader()}>
      {isAllCustomExpanderExpanded ? (
        <FaAngleDown className="cursor-pointer text-[var(--primary-text)]" />
      ) : (
        <FaAngleRight className="cursor-pointer text-[var(--primary-text)]" />
      )}
    </IconButton>
  ),
  sticky: 'left',
  size: 70,
  minSize: 70,
  maxSize: 70,
  minWidth: 70,
  width: 70,
  maxWidth: 70,
  disableFilters: true,
  disableSortBy: true,
  filterFn: null,
  sortingFn: null,
  canDrag: false,
  cell: ({ row }) => (
    <div>
      <IconButton size="small" style={{ fontSize: 13 }} onClick={() => handleToggleSingleCustomExpnader(row.id)}>
        {isSingleCustomExpanderExpanded(row.id) ? <FaAngleDown /> : <FaAngleRight />}
      </IconButton>
    </div>
  )
});

const fetchChildAttachmentWrapper = async ({ row, fetchChildAttachment, dispatch, allRows }) => {
  if (!fetchChildAttachment || row.original[childrenProperty]?.length > 0) return;
  dispatch({ type: 'loadingExpanderRowId', loadingExpanderRowId: row.original._id });
  try {
    if (row?.original[childrenProperty]?.length > 0 || row[childrenProperty]?.length > 0) {
      row?.toggleExpanded();
      dispatch({ type: 'loadingExpanderRowId', loadingExpanderRowId: null });
      return;
    }

    let subRows = await fetchChildAttachment(row.original._id);
    if (!subRows || subRows?.length === 0) {
      row.original.canExpand = false;
      row.canExpand = false;
      return;
    }
    insertChildRowIntoTable({ existingRows: allRows, subRowsToInsert: subRows, parentId: row.original._id, dispatch });

    setTimeout(() => {
      row?.toggleExpanded();
    }, 50);
  } catch (error) {
    console.error(error);
  } finally {
    dispatch({ type: 'loadingExpanderRowId', loadingExpanderRowId: null });
  }
};

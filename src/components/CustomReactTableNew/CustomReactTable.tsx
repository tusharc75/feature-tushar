import React, { useEffect, useState } from 'react';
import MaUTable from '@material-ui/core/Table';
import { TableBody, IconButton, TableCell, TableHead, TableRow, Box, CircularProgress, Button, TableFooter } from '@material-ui/core';
import { Check, Edit, Error } from '@material-ui/icons';
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { columnFilter } from './ReactTableHelpers';
import { gridPageSizes } from '../../constants/helpers';
import { isString, uniqBy, debounce } from 'lodash';
import { flattenArray } from 'src/constants/columns';
import {
  useTable,
  useExpanded,
  useRowSelect,
  useFlexLayout,
  useSortBy,
  useResizeColumns,
  useFilters,
  useColumnOrder,
  usePagination,
  useRowState,
  CheckboxProps
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomReactTableHeaderOptions from './CustomReactTableHeaderOptions';
import { isMobile, isTablet } from 'react-device-detect';
import Checkbox from '@material-ui/core/Checkbox';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import HtmlTooltip from '../CustomTooltipTitle';
import ArrangeViewButton from './ArrangeViewButton';
import { GrFormClose } from 'react-icons/gr';
import { CgSearch } from 'react-icons/cg';
import GridHeader from './GridHeader';
import SwipableListForMobile from 'src/components/CustomReactTableNew/SwipableListForMobile';
import Pagination from './Pagination';
import { BiFilterAlt } from 'react-icons/bi';
import GridFilter from './Filters';
import type { TInitialState } from './useTableReducer';
import { TouchBackend } from 'react-dnd-touch-backend';
import { useStore, SEARCH } from 'src/StateProvider/fastContext';

const childrenProperty = 'subRows';
interface CustomCheckBoxProps extends CheckboxProps {
  indeterminate: any;
  from?: string;
  style?: React.CSSProperties;
}

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, from, style, ...rest }: CustomCheckBoxProps, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef: any = ref || defaultRef;
  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);
  return (
    <Checkbox
      size="small"
      ref={resolvedRef}
      {...rest}
      defaultChecked={false}
      color="primary"
      style={{ ...style, color: from === 'Header' ? 'white' : 'inherit', padding: 0 }}
      inputProps={{ 'aria-label': 'secondary checkbox' }}
    />
  );
});

function TempFilter({ filterValue, id, setFilters, customFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleFilterChange = (newValue) => {
    let tempArr = Object.keys(customFilters).map((key, i) => {
      return { id: key, value: customFilters[key].filter };
    });
    const existingFilterIndex = tempArr.findIndex((filter) => filter.id === id);

    if (existingFilterIndex !== -1) {
      // Update existing filter
      const updatedFilters = tempArr.map((filter, index) => (index === existingFilterIndex ? { ...filter, value: newValue } : filter));
      setFilters(updatedFilters);
    } else {
      // Add new filter
      const newFilter = { id, value: newValue };
      setFilters([...tempArr, newFilter]);
    }
  };

  return (
    <div>
      <IconButton onClick={() => setIsOpen(true)} size="small" className={`${filterValue ? 'activeFilter' : ''}`}>
        <CgSearch />
      </IconButton>

      <div className={`tableFilterSearch ${isOpen ? 'open' : ''}`} ref={ref}>
        <input
          value={filterValue || ''}
          onChange={(e) => handleFilterChange(e.target.value)}
          autoComplete="off"
          placeholder="Search..."
          type="text"
          id="search"
          aria-hidden={!isOpen}
          ref={inputRef}
        />

        <GrFormClose
          onClick={() => {
            if ((filterValue || '').trim() === '') {
              setIsOpen(false);
              return;
            }
            handleFilterChange('');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

function DefaultColumnFilter({ column: { filterValue, setFilter, filter } }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = React.useRef(null);
  const inputRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div>
      <IconButton onClick={() => setIsOpen(true)} size="small" className={`${filterValue ? 'activeFilter' : ''}`}>
        <CgSearch />
      </IconButton>

      <div className={`tableFilterSearch ${isOpen ? 'open' : ''}`} ref={ref}>
        <input
          value={filterValue || ''}
          onChange={(e) => {
            setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
          }}
          autoComplete="off"
          placeholder={`Search ${filter ? filter : ''}...`}
          type="text"
          id="search"
          aria-hidden={!isOpen}
          ref={inputRef}
        />

        <GrFormClose
          onClick={() => {
            setFilter('');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

const EditableCell = ({ value: initialValue, row: { index }, column: { id }, updateData }) => {
  const [value, setValue] = React.useState(initialValue);
  const onChange = (e) => {
    setValue(e.target.value);
  };

  const onBlur = () => {
    updateData(index, id, value);
  };

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return <input value={value} onChange={onChange} onBlur={onBlur} />;
};

function CustomReactTable({
  columns,
  onSelect = null,
  setWholeRowsCellColor = null,
  height = '100%',
  hideSelection = false,
  renderedFrom,
  isClientSideGrid = true,
  expander = false,
  refreshGrid = null,
  dispatch,
  state,
  fetchChildAttachment = null,
  showOnlyShowFilteredRecordSwitch = false,
  showFilters = false,
  resource = null,
  onSaveEdit = null,
  hideAction = false
}) {
  const {
    showFilteredRecordsOnly,
    currentEditingCellPosition,
    dataRows: data,
    rowCount,
    selectedRecords,
    loading,
    page,
    limit,
    pageSizes,
    search,
    filters: customFilters,
    sorting,
    error
  }: TInitialState = state;
  const isMobileView = isMobile && !isTablet;
  const defaultColumn = {
    Cell: EditableCell,
    minWidth: 80,
    width: 200,
    Filter: DefaultColumnFilter
  };
  const [searchQuery] = useStore((store) => store[SEARCH]);
  const [cellValue, setCellValue] = React.useState('');
  const [baseColumns, setBaseColumns] = React.useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [currentFomValue, setCurrentFomValue] = useState({});

  useEffect(() => {
    let timer;
    if (!isClientSideGrid) {
      if (searchQuery) {
        timer = setTimeout(() => {
          let query = searchQuery?.trim();
          if (query !== '') {
            dispatch({ type: 'search', search: query });
          }
        }, 300);
      } else {
        timer = setTimeout(() => {
          dispatch({ type: 'search', search: '' });
          dispatch({ type: 'loading', loading: false });
        }, 300);
      }
    }
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getPreviouslySelectedRowIndex = () => {
    const len = selectedRecords.length;
    const obj = {};
    for (let i = 0; i < len; i++) {
      const id = selectedRecords[i]?.id;
      const index = data.findIndex((row) => row?.id === id);
      if (index >= 0) {
        obj[index] = true;
      }
    }
    return obj;
  };

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleFilterClose = () => {
    setIsFilterOpen(false);
  };

  useEffect(() => {
    columns?.forEach((e) => {
      if (e.accessor === 'action') {
        e.disableFilters = true;
        e.disableSortBy = true;
        e.canDrag = false;
        if (!e.maxWidth) {
          e.maxWidth = 120;
        }
      }
    });
    setBaseColumns(columns);
  }, [columns]);

  const newColumns = React.useMemo(
    () => [
      ...(expander
        ? [
            {
              accessor: 'expander',
              id: 'expander',
              Header: ({ isAllRowsExpanded }) => (
                <span
                  style={{
                    paddingLeft: '0.3rem',
                    color: 'black'
                  }}
                >
                  {isAllRowsExpanded ? (
                    <FaAngleDown
                      className="cursor-pointer text-[var(--primary-text)]"
                      onClick={() => {
                        toggleAllRowsExpanded(false);
                      }}
                    />
                  ) : (
                    <FaAngleRight
                      className="cursor-pointer text-[var(--primary-text)]"
                      onClick={() => {
                        toggleAllRowsExpanded(true);
                      }}
                    />
                  )}
                </span>
              ),
              sticky: 'left',
              width: isMobile && !isTablet ? 40 : 70,
              minWidth: isMobile && !isTablet ? 40 : 70,
              disableFilters: true,
              disableSortBy: true,
              canDrag: false,
              Cell: ({ row }) => (
                <div
                  {...row.getToggleRowExpandedProps?.({
                    style: {
                      marginLeft: isMobileView ? 0 : `${row.depth * 15}px`
                    }
                  })}
                >
                  {row.original.type === 'folder' || row.canExpand ? (
                    <IconButton size="small" style={{ fontSize: 13 }}>
                      {row.isExpanded ? (
                        <FaAngleDown />
                      ) : (
                        <FaAngleRight
                          onClick={async () => {
                            if (!fetchChildAttachment || row.original[childrenProperty]?.length > 0) return;
                            const subRows = await fetchChildAttachment(row.original.id);
                            row.original.subRows = subRows;
                            row.canExpand = true;
                            row.isExpanded = true;
                          }}
                        />
                      )}
                    </IconButton>
                  ) : null}
                </div>
              )
            }
          ]
        : []),
      ...(!hideSelection
        ? [
            {
              accessor: 'selection',
              id: 'selection',
              minWidth: 50,
              width: 50,
              maxWidth: 50,
              sticky: 'left',
              disableFilters: true,
              disableSortBy: true,
              canDrag: false,
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} className="mx-auto text-center" />
              ),
              Cell: ({ row }) => (
                <div className="mx-auto text-center justify-center">
                  {row.original.hideSelection ? <></> : <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />}
                </div>
              )
            }
          ]
        : []),
      ...baseColumns.map((m) => {
        return m.canFilter === false
          ? { ...m, columnFilterable: false, filter: 'filterRowsWithSubrows' }
          : { ...m, columnFilterable: true, filter: 'text' };
      })
    ],
    [baseColumns]
  );

  const filterTypes = React.useMemo(
    () => ({
      filterRowsWithSubrows: (rows, id, filterValue) => columnFilter(rows, id, filterValue),
      text: (rows, id, filterValue) => {
        return rows.filter((row) => {
          const rowValue = row.values[id];
          return rowValue !== undefined ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase()) : true;
        });
      }
    }),
    []
  );

  const updateData = () => {};

  const getDataFromLocalStorage = () => {
    try {
      const data = localStorage.getItem('gridMetaData');
      return data && data !== 'undefined' ? JSON.parse(data) : {};
    } catch (ex) {
      return {};
    }
  };

  const returnHiddenCols = () => {
    const gridMetaData = getDataFromLocalStorage();
    const hiddenCols = gridMetaData[renderedFrom]?.hide || [];
    if (hideAction) {
      hiddenCols.push('action');
    }
    return hiddenCols;
  };

  const {
    getTableProps,
    rows,
    headerGroups,
    prepareRow,
    allColumns,
    setHiddenColumns,
    getToggleHideAllColumnsProps,
    gotoPage,
    selectedFlatRows,
    toggleRowExpanded,
    toggleAllRowsExpanded,
    setColumnOrder,
    footerGroups,
    setCellState,
    toggleAllRowsSelected,
    state: { rowState, pageIndex, sortBy, selectedRowIds, columnOrder }
  } = useTable(
    {
      columns: newColumns,
      data,
      onSelect,
      defaultColumn,
      filterTypes,
      initialState: {
        sortBy: sorting.map((d) => {
          return { desc: d.sort === 'asc' ? false : true };
        }),
        pageIndex: page,
        expanded: false,
        autoResetExpanded: false,
        hiddenColumns: returnHiddenCols(),
        selectedRowIds: getPreviouslySelectedRowIndex()
      },
      getSubRows: (row: any) => row[childrenProperty],
      sortTypes: {
        alphanumeric: (row1, row2, columnName, desc: boolean) => {
          if (isClientSideGrid) {
            const rowOneColumn = row1.values[columnName];
            const rowTwoColumn = row2.values[columnName];
            if (isString(rowOneColumn)) {
              return rowOneColumn?.toUpperCase() > rowTwoColumn?.toUpperCase() ? 1 : -1;
            }
            return Number(rowOneColumn) > Number(rowTwoColumn) ? 1 : -1;
          }
        }
      },
      updateData
    },
    useFlexLayout,
    useColumnOrder,
    useResizeColumns,
    useFilters,
    useSortBy,
    useExpanded,
    usePagination,
    useRowSelect,
    useSticky,
    useRowState
  );

  useEffect(() => {
    try {
      let gridMetaData = getDataFromLocalStorage();
      if (gridMetaData && gridMetaData[renderedFrom]?.hide && gridMetaData[renderedFrom]?.hide?.length) {
        setHiddenColumns(gridMetaData[renderedFrom]?.hide || []);
      }
      if (gridMetaData && gridMetaData[renderedFrom]?.order && gridMetaData[renderedFrom]?.order?.length) {
        const colOrder = [...(expander ? ['expander'] : []), ...(!hideSelection ? ['selection'] : []), ...gridMetaData[renderedFrom]?.order];
        setColumnOrder(colOrder);
      } else {
        setColumnOrder(newColumns.map((m) => m?.id));
      }
    } catch (ex) {
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, []);

  useEffect(() => {
    rows.forEach((d) => {
      if (d[childrenProperty] && d[childrenProperty].length < 20) {
        toggleAllRowsExpanded(true);
        toggleRowExpanded(d.id, true);
      }
    });
  }, []);

  useEffect(() => {
    if (!isClientSideGrid) {
      let tempArray = sorting.map((d) => {
        return { desc: d.sort === 'asc' ? false : true };
      });
      if (JSON.stringify(sortBy) !== JSON.stringify(tempArray)) {
        sortBy?.forEach((v) => {
          dispatch({
            type: 'sort',
            sorting: [{ colId: v.id, sort: v.desc ? 'desc' : 'asc' }]
          });
        });
      }
    }
  }, [sortBy]);

  useEffect(() => {
    let flatSelectedData = [];
    Object.keys(selectedRowIds).forEach((key) => {
      const splittedArray = key.split('.');
      if (splittedArray.length === 0) {
        const { subRows, ...rest } = data[key];
        flatSelectedData.push({ ...rest });
      } else if (selectedRowIds[key]) {
        let dataToStore = null;
        splittedArray.forEach((f, index) => {
          if (index === 0) {
            dataToStore = { ...data[f] };
          } else {
            dataToStore = { ...dataToStore['subRows'][f] };
          }
        });
        const { subRows, ...rest } = dataToStore;
        flatSelectedData.push({ ...rest });
      }
    });

    const includedRow: any = [];
    const notIncludedRow: any = [];

    selectedRecords.forEach((row) => {
      if (data.find((d) => d.id === row.id)) {
        includedRow.push(row);
      } else {
        notIncludedRow.push(row);
      }
    });

    if (onSelect) onSelect([...notIncludedRow, ...flatSelectedData]);
    dispatch({
      type: 'selection',
      selectedRecords: [...notIncludedRow, ...flatSelectedData]
    });
    // setSelectedRow([...notIncludedRow, ...flatSelectedData]);
  }, [selectedRowIds, renderedFrom]);

  const reorder = (item: any, newIndex: number) => {
    const { index: currentIndex } = item;
    const dragColumn = columnOrder[currentIndex];
    const hoverColumn = columnOrder[newIndex];
    const firstElement = columnOrder[0];

    const dragItem = allColumns.find((col) => col?.id === dragColumn || col?.id === dragColumn);
    const hoverItem = allColumns.find((col) => col?.id === hoverColumn || col?.id === hoverColumn);

    if (dragItem?.id === 'action' || dragItem?.id === 'selection' || dragItem?.lockPosition) return;
    if (hoverItem?.id === 'action' || hoverItem?.id === 'selection' || hoverItem?.lockPosition) return;

    const newOrderedColumns: string[] = update(columnOrder, {
      $splice: [
        [currentIndex, 1],
        [newIndex, 0, dragColumn]
      ]
    });

    let newBaseColumns = new Array();
    baseColumns.forEach((item) => {
      let filteredOrder = newOrderedColumns.filter((el) => el !== firstElement);
      const index = filteredOrder.indexOf(item.id);
      newBaseColumns[index] = item;
    });

    setColumnOrder(newOrderedColumns);
    setBaseColumns(newBaseColumns);
  };

  const submitInput = () => {
    if (!currentEditingCellPosition) return;
    const updatedData = flattenArray(data)?.find((row) => row?._id === currentEditingCellPosition.rowId);
    updatedData[currentEditingCellPosition.columnName] = cellValue;
    const inputField = { [`${currentEditingCellPosition.columnName}`]: cellValue };
    if (onSaveEdit && ![undefined, null].includes(cellValue)) {
      onSaveEdit(inputField, updatedData);
    }
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  const mobileSelectAllHeader: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'selection') || null, [allColumns]);

  const handleKeyDown = (e) => {
    if (!currentEditingCellPosition) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      submitInput();
    }
  };

  const handleCellClick = (cell, row) => {
    // prepareRow(row);
    if (!cell.column.id || !row.original._id || !cell?.column?.editable) return;

    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: {
        rowId: row.original._id,
        columnName: cell.column.id
      }
    });
    setCellValue(cell?.value || null);
  };

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  return (
    <DndProvider backend={isMobile || isTablet ? TouchBackend : HTML5Backend}>
      <div className="custom-react-table custom-react-table-v1 vertical-center">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            refreshGrid={refreshGrid}
            loading={loading}
            buttons={
              <>
                {showFilters && (
                  <HtmlTooltip title="Apply Filters" placement="top" arrow>
                    <Button
                      style={{ marginRight: '8px', color: '#424242' }}
                      startIcon={<BiFilterAlt />}
                      size={'small'}
                      variant="outlined"
                      className="btn-outline-v1 light "
                      onClick={handleFilterOpen}
                    >
                      Filter
                    </Button>
                  </HtmlTooltip>
                )}
                <ArrangeViewButton
                  columns={newColumns}
                  loading={loading}
                  renderedFrom={renderedFrom}
                  setHiddenColumns={setHiddenColumns}
                  getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
                  defaultColumns={allColumns}
                  setColumnOrder={setColumnOrder}
                />
              </>
            }
            startButtons={
              isMobileView &&
              !hideSelection &&
              mobileSelectAllHeader && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer ml-[13px]">
                    {mobileSelectAllHeader.render('Header')} <span>Select All</span>
                  </label>
                </>
              )
            }
          >
            <CustomReactTableHeaderOptions
              columns={baseColumns}
              customFilters={customFilters}
              renderedFrom={renderedFrom}
              dispatchTable={dispatch}
              showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
              selectedRecords={selectedRecords?.length}
              showFilters={showFilters}
              handleFilterOpen={handleFilterOpen}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              currentFomValue={currentFomValue}
              setCurrentFomValue={setCurrentFomValue}
            />
            {/* Select All For Mobile */}

            {isFilterOpen && (
              <GridFilter
                resource={resource}
                customFilters={customFilters}
                handleClose={handleFilterClose}
                setSelectedFilter={setSelectedFilter}
                selectedFilter={selectedFilter}
                currentFomValue={currentFomValue}
                setCurrentFomValue={setCurrentFomValue}
                dispatch={dispatch}
              />
            )}
          </GridHeader>

          {/* Table */}
          {!isMobileView && (
            <div
              style={{
                display: 'block',
                overflow: !loading && !error && rows.length === 0 ? 'hidden' : 'auto',
                height: height ?? '100%'
              }}
              className="border"
            >
              {(loading || error) && (
                <Box className="bg-[rgba(255,255,255,0.2)] dark:bg-[rgba(0,0,0,0.1)] w-full h-full z-[100] absolute inset-0 flex justify-center items-center">
                  <div className="bg-[white] dark:bg-[var(--dark-secondary)] px-10 py-5 rounded-lg text-center shadow-md">
                    {error ? (
                      <>
                        <Error className="mx-auto mb-2" />
                        <p>Something Went Wrong</p>
                      </>
                    ) : loading ? (
                      <>
                        <CircularProgress />
                        <p>Loading...</p>
                      </>
                    ) : null}
                  </div>
                </Box>
              )}
              <div className="relative">
                {!loading && !error && rows.length === 0 && (
                  <>
                    <Box
                      style={{ height: `calc(${height ?? '100%'} - 60px)` }}
                      className="w-full h-full z-[100] absolute inset-0 top-[46px] flex justify-center items-center"
                    >
                      <div className=" px-10 py-5 rounded-lg text-center">
                        <p>No data found</p>
                      </div>
                    </Box>
                  </>
                )}
                <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
                  <TableHead style={{ overflowY: 'auto', overflowX: 'hidden' }} className="header">
                    {headerGroups.map((headerGroup, index) => (
                      <React.Fragment key={index}>
                        <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                          {headerGroup.headers.map((column, index) => (
                            <React.Fragment key={column.id}>
                              <DraggableHeader
                                key={column.id}
                                column={column}
                                reorder={reorder}
                                index={index}
                                customFilters={customFilters}
                                dispatch={dispatch}
                                isClientSideGrid={isClientSideGrid}
                              />
                            </React.Fragment>
                          ))}
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableHead>

                  <TableBody
                    style={{
                      overflowY: 'scroll',
                      overflowX: 'hidden'
                      // height: "250px"
                    }}
                    className="body relative"
                  >
                    {rows.map((row, index1) => {
                      prepareRow(row);
                      const rowProps = row.getRowProps();
                      return (
                        <TableRow key={index1} {...rowProps} className={`tr`}>
                          {row.cells.map((cell, index2) => {
                            const cellProps = cell.getCellProps();

                            if (cell.column.maxWidth) {
                              cellProps.style = { ...cellProps.style, maxWidth: cell.column.maxWidth };
                            }
                            return (
                              <TableCell
                                key={index2}
                                {...cellProps}
                                className={`td p-0 [&>*]:h-[45px] [&>*]:flex [&>*]:items-center [&>*]:p-[5px_8px] h-[45px]  ${
                                  cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''
                                }    ${setWholeRowsCellColor ? setWholeRowsCellColor(row.original) : ''}`}
                                onClick={() => {
                                  handleCellClick(cell, row);
                                }}
                                onKeyDown={(e) => {
                                  handleKeyDown(e);
                                }}
                              >
                                {!['selection'].includes(cell?.column.id) &&
                                currentEditingCellPosition?.rowId === row.original._id &&
                                currentEditingCellPosition?.columnName === cell?.column.id ? (
                                  <div className="w-full">
                                    <input
                                      title={`Edit-${cell.id}`}
                                      autoFocus
                                      onBlur={() => (cell.value !== cellValue ? submitInput() : resetField())}
                                      value={cellValue}
                                      className="dark:text-[white]  appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
                                      onChange={(e) => setCellValue(e.target.value)}
                                    />
                                  </div>
                                ) : currentEditingCellPosition?.rowId === row.original._id && cell?.column.id === 'action' ? (
                                  <HtmlTooltip title="Save">
                                    <IconButton size="small" aria-label="Save" onClick={submitInput}>
                                      <Check color="primary" />
                                    </IconButton>
                                  </HtmlTooltip>
                                ) : cell.column?.editable && cell?.value ? (
                                  <div className="w-full">
                                    <div className="[border-bottom:1px_dashed_#8a8a8a] cursor-pointer flex w-full justify-between">
                                      <p>{cell?.value}</p>
                                      <span>
                                        <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
                                      </span>
                                    </div>
                                  </div>
                                ) : cell.column.id === 'action' ? (
                                  <div className="action-cell">{cell.render('Cell')}</div>
                                ) : (
                                  cell.render('Cell')
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  {rows?.length > 0 && footerGroups?.length > 0 && isClientSideGrid && (
                    <TableFooter style={{ overflowY: 'auto', overflowX: 'hidden' }} className="footer ">
                      {footerGroups.map((group) => (
                        <TableRow {...group.getFooterGroupProps()} className="tr">
                          {group.headers.map((column) => (
                            <TableCell {...column.getHeaderProps()} className="th text-truncate font-weight-bold text-black">
                              {column.render('Footer')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableFooter>
                  )}
                </MaUTable>
              </div>
            </div>
          )}
        </div>

        {isMobileView && rows ? (
          <SwipableListForMobile
            key={pageIndex}
            prepareRow={prepareRow}
            allColumns={allColumns}
            allowSelection={!hideSelection}
            dataRows={rows}
            dispatch={dispatch}
            loading={loading}
            page={page}
            rowCount={rowCount}
            expander={expander}
            backgroundColorClass={setWholeRowsCellColor}
            renderedFrom={renderedFrom}
            IndeterminateCheckbox={IndeterminateCheckbox}
            toggleAllRowsSelected={toggleAllRowsSelected}
            state={state}
            submitInput={submitInput}
            cellValue={cellValue}
            setCellValue={setCellValue}
            handleCellClick={handleCellClick}
            handleKeyDown={handleKeyDown}
            footerGroups={footerGroups}
            isClientSideGrid={isClientSideGrid}
          />
        ) : null}
        {!isClientSideGrid && (
          <Pagination
            count={rowCount}
            page={pageIndex}
            onPageChange={(event, newPage) => {
              gotoPage(newPage);
              dispatch({ type: 'pageChange', page: newPage });
            }}
            rowsPerPage={limit}
            onRowsPerPageChange={(event, value) => {
              dispatch({ type: 'pageSizeChange', limit: value });
            }}
            rowsPerPageOptions={gridPageSizes}
            disabled={loading}
          />
        )}
      </div>
    </DndProvider>
  );
}

export default CustomReactTable;

const ItemTypes = {
  COLUMN: 'COLUMN'
};

interface DraggableHeaderProps {
  column: any;
  index: number;
  reorder: (item: any, index: number) => void;
  customFilters: any;
  dispatch: (action: any) => void;
  isClientSideGrid: boolean;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({ column, index, reorder, customFilters, dispatch, isClientSideGrid }) => {
  const ref = React.useRef();
  const { id, Header, render, canFilter } = column;
  const [filters, setFilters] = useState([]);


  // Use a useEffect to update filters when customFilters changes
  useEffect(() => {
    setFilters(
      Object.keys(customFilters).map((key, i) => ({
        id: key,
        value: customFilters[key].filter
      }))
    );
  }, [customFilters]); // Add customFilters as a dependency

  const MINIMUM_SEARCH_DELAY = 600; // Adjust this delay as needed

  const debouncedFilterDispatch = debounce((updatedCustomFilters) => {
    dispatch({ type: 'filter', filters: updatedCustomFilters });
  }, MINIMUM_SEARCH_DELAY);

  const [, drop] = useDrop({
    accept: ItemTypes.COLUMN,
    drop: (item) => {
      reorder(item, index);
    },
    canDrop: () => !column?.lockPosition || column?.id !== 'selection' || column?.id !== 'action'
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COLUMN,
    item: () => {
      return {
        id,
        index,
        header: Header
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    canDrag: !column?.lockPosition || column?.id !== 'selection' || column?.id !== 'action' || column?.id !== 'expand'
  });
  useEffect(() => {
    // Add a timer to delay the dispatch
    const searchTimer = setTimeout(() => {
      let tempArray = Object.keys(customFilters).map((key, i) => {
        return { id: key, value: customFilters[key].filter };
      });

      if (JSON.stringify(filters) !== JSON.stringify(tempArray)) {
        var tempResult = {};
        filters?.forEach((v) => {
          if (v.value && v.value !== '') {
            tempResult[v.id] = { filter: v.value };
          } else {
            //this is for handling condition where the customFilters has a multiselect type field and we type something in some other filter
            if (customFilters[v.id] && customFilters[v.id].operator && customFilters[v.id].condition1) {
              tempResult[v.id] = customFilters[v.id];
            }
          }
        });
        if (!isClientSideGrid) debouncedFilterDispatch(tempResult);
      }
    }, MINIMUM_SEARCH_DELAY);

    // Clear the timer when the component unmounts or when filters change
    return () => clearTimeout(searchTimer);
  }, [filters]);

  drag(drop(ref));

  const headerProps = column.getHeaderProps();
  if (column.maxWidth) {
    headerProps.style = { ...headerProps.style, maxWidth: column.maxWidth };
  }

  return (
    <TableCell {...headerProps} className="th text-truncate table-header">
      <div
        ref={ref}
        className={`d-flex items-center ${column.id === 'selection' ? 'justify-center' : 'justify-between'} pos-rel`}
        style={{ width: '100%' }}
      >
        <div
          style={{ opacity: isDragging ? 0.2 : 1 }}
          className="d-flex gap-2 align-items-center "
          {...column.getSortByToggleProps({ title: undefined })}
        >
          <div className="line-clamp-1">
            <span className=" overflow-hidden overflow-ellipsis whitespace-normal">{column.render('Header')}</span>
          </div>
          {column.isSorted ? column.isSortedDesc ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> : ''}
        </div>
        {column?.columnFilterable && column?.id !== 'action' ? (
          <div>
            {canFilter ? (
              !isClientSideGrid ? (
                <TempFilter
                  filterValue={filters.find((filter) => filter.id === column.id)?.value || ''}
                  id={column?.id}
                  setFilters={setFilters}
                  customFilters={customFilters}
                />
              ) : (
                render('Filter')
              )
            ) : null}
          </div>
        ) : null}
      </div>
      <div {...column.getResizerProps()} className="resizer" />
    </TableCell>
  );
};

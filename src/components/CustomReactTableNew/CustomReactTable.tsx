import React, { useEffect, useState } from 'react';
import MaUTable from '@material-ui/core/Table';
import {
  TableBody,
  IconButton,
  TableCell,
  TableHead,
  TableFooter,
  TableRow,
  TextField,
  TablePagination,
  Box,
  CircularProgress
} from '@material-ui/core';
import { Check } from '@material-ui/icons';
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { columnFilter } from './ReactTableHelpers';
import { gridPageSizes } from '../../constants/helpers';
import { isString, uniqBy, debounce } from 'lodash';
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
import SwipableListForMobile from 'src/components/SwipableListForMobile';
import Pagination from './Pagination';

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
            handleFilterChange('');
            setIsOpen(false);
          }}
        />
      </div>
    </div>
  );
}

function DefaultColumnFilter({ column: { filterValue, setFilter } }) {
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
          placeholder="Search..."
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
  data,
  onSelect,
  setWholeRowsCellColor = null,
  height = '100%',
  hideSelection = false,
  renderedFrom,
  isClientSideGrid = true,
  currentPage = 1,
  rowCount,
  expander = false,
  allowPagination = true,
  limit = gridPageSizes[0],
  customFilters = [],
  refreshGrid = null,
  dispatch,
  sorting,
  loading,
  fetchChildAttachment = null,
  showOnlyShowFilteredRecordSwitch = false
}) {
  const isMobileView = isMobile && !isTablet;
  const defaultColumn = {
    Cell: EditableCell,
    minWidth: 80,
    width: 150,
    Filter: DefaultColumnFilter
  };

  const [cellValue, setCellValue] = React.useState('');
  const [isCellEditing, setIsCellEditing] = React.useState(false);
  const [currentRowEditing, setCurrentRowEditing] = React.useState(null);
  const [baseColumns, setBaseColumns] = React.useState([]);

  useEffect(() => {
    setBaseColumns(columns);
  }, [columns]);

  const handleCellSelection = (row) => {
    if (!isClientSideGrid) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : [];

        if (!row.isSelected && !oldSelectedRecords.some((s) => s['_id'] === row?.original?._id)) {
          oldSelectedRecords = [...oldSelectedRecords, row?.original];

          localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(oldSelectedRecords));
        } else if (row.isSelected) {
          if (oldSelectedRecords.length > 0) {
            localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(oldSelectedRecords.filter((f) => f['_id'] !== row?.original?._id)));
          }
        }
      } catch (ex) {
        console.error('Error in getting / storing selected records');
      }
    }
  };

  const handleAllSelect = (checked) => {
    if (checked) {
      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
    }
  };

  const newColumns = React.useMemo(
    () =>
      expander
        ? [
            {
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
                      style={{ color: 'white' }}
                      className="cursor-pointer"
                      onClick={() => {
                        toggleAllRowsExpanded(false);
                      }}
                    />
                  ) : (
                    <FaAngleRight
                      style={{ color: 'white' }}
                      className="cursor-pointer"
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
              canDrag: false,
              Cell: ({ row }) =>
                row.original.type === 'folder' ? (
                  <IconButton
                    {...row.getToggleRowExpandedProps?.({
                      style: {
                        marginLeft: isMobileView ? 0 : `${row.depth * 2}rem`
                      }
                    })}
                    size="small"
                  >
                    {row.isExpanded ? (
                      <FaAngleDown />
                    ) : (
                      <FaAngleRight
                        onClick={async () => {
                          const subRows = await fetchChildAttachment(row.original.id);
                          row.original.subRows = subRows;
                        }}
                      />
                    )}
                  </IconButton>
                ) : null
            },
            {
              id: 'selection',
              minWidth: 50,
              width: 50,
              maxWidth: 50,
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <IndeterminateCheckbox
                  onClick={(e) => handleAllSelect(getToggleAllRowsSelectedProps()?.checked)}
                  {...getToggleAllRowsSelectedProps()}
                  style={{ marginLeft: '7px' }}
                />
              ),
              Cell: ({ row }) => <IndeterminateCheckbox onClick={() => handleCellSelection(row)} {...row.getToggleRowSelectedProps()} />
            },
            ...baseColumns.map((m) => {
              return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' };
            })
          ]
        : [
            {
              id: 'selection',
              minWidth: 50,
              width: 50,
              maxWidth: 50,
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <IndeterminateCheckbox
                  onClick={(e) => handleAllSelect(getToggleAllRowsSelectedProps()?.checked)}
                  {...getToggleAllRowsSelectedProps()}
                  style={{ marginLeft: '7px' }}
                />
              ),
              Cell: ({ row }) => <IndeterminateCheckbox onClick={() => handleCellSelection(row)} {...row.getToggleRowSelectedProps()} />
            },
            ...baseColumns.map((m) => {
              return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' };
            })
          ],
    [baseColumns]
  );

  const filterTypes = React.useMemo(
    () => ({
      filterRowsWithSubrows: (rows, id, filterValue) => columnFilter(rows, id, filterValue)
    }),
    []
  );
  const updateData = () => {};

  const returnHiddenCols = () => {
    const storedColumns = JSON.parse(localStorage.getItem(renderedFrom));

    let hiddenCols = [];
    if (storedColumns) {
      hiddenCols = storedColumns.filter((f) => f.isVisible === false).map((m) => m.id);
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
        columnOrder: newColumns.map((col) => col?.id || col?.accessor),
        sortBy: sorting.map((d) => {
          return { id: d.colId, desc: d.sort === 'asc' ? false : true };
        }),
        pageIndex: currentPage,
        autoResetExpanded: false,
        hiddenColumns: hideSelection ? ['selection', 'action'] : returnHiddenCols(),
        selectedRowIds: localStorage.getItem(`${renderedFrom}_selected`)
          ? Object.assign(
              {},
              data.map((d) => JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)).some((obj) => obj._id === d._id))
            )
          : {}
      },
      getSubRows: (row: any) => row.subRows,
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
    rows.forEach((d) => {
      if (d.subRows && d.subRows.length < 20) {
        toggleAllRowsExpanded(true);
        toggleRowExpanded(d.id, true);
      }
    });

    try {
      const storedColumns = localStorage.getItem(renderedFrom);
      if (storedColumns) {
        setColumnOrder(JSON.parse(storedColumns).map((m) => m.id));
        setHiddenColumns(
          JSON.parse(storedColumns)
            .filter((f) => f.isVisible === false)
            .map((m) => m.id)
        );
      }
    } catch (ex) {
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, []);

  useEffect(() => {
    if (!isClientSideGrid) {
      let tempArray = sorting.map((d) => {
        return { id: d.colId, desc: d.sort === 'asc' ? false : true };
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
      if (splittedArray.length <= 1 && selectedRowIds[key]) {
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
    onSelect([...flatSelectedData]);
    dispatch({
      type: 'selection',
      selectedRecords: [...flatSelectedData]
    });

    if (renderedFrom) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : [];
        if (oldSelectedRecords.length > 0) {
          const uniqueRecords = uniqBy([...oldSelectedRecords, ...flatSelectedData], '_id');
          localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(uniqueRecords));
        } else {
          localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(flatSelectedData));
        }
      } catch (ex) {
        console.error('Error in getting / storing selected records');
      }
    }
  }, [selectedRowIds]);

  const reorder = (item: any, newIndex: number) => {
    const { index: currentIndex } = item;
    const dragColumn = columnOrder[currentIndex];
    const hoverColumn = columnOrder[newIndex];
    const firstElement = columnOrder[0];

    const dragItem = allColumns.find((col) => col?.id === dragColumn || col?.accessor === dragColumn);
    const hoverItem = allColumns.find((col) => col?.id === hoverColumn || col?.accessor === hoverColumn);

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
      const index = filteredOrder.indexOf(item.accessor);
      newBaseColumns[index] = item;
    });

    setColumnOrder(newOrderedColumns);
    setBaseColumns(newBaseColumns);
  };

  useEffect(() => {
    if (!allColumns || !Array.isArray(allColumns)) {
      return;
    }
    const timeout = setTimeout(() => {
      const newColumnState = allColumns.map((column) => {
        const object = {};
        Object.keys(column).forEach((key) => {
          if (typeof column[key] !== 'function' && typeof column[key] !== 'object') {
            object[key] = column[key];
          }
        });
        return object;
      });
      localStorage.setItem(renderedFrom, JSON.stringify(newColumnState));
    }, 500);
    return () => clearTimeout(timeout);
  }, [allColumns]);

  const submitInput = () => {
    const rowData = Object.keys(rowState[currentRowEditing.id].cellState).filter((k) => rowState[currentRowEditing.id].cellState[k].isEditing);
    const updatedData = data.map((row: any) => {
      if (row._id == currentRowEditing?.original._id) {
        row[rowData[0]] = cellValue;
      }
      return row;
    });
    dispatch({
      type: 'initialize',
      data: updatedData,
      count: rowCount
    });
    Object.keys(rowState).forEach((rowId) => {
      Object.keys(rowState[rowId].cellState).forEach((colId) => {
        setCellState(rowId, colId, { isEditing: false });
      });
    });
    setIsCellEditing(false);
    setCurrentRowEditing(null);
    setCellValue('');
  };

  const mobileSelectAllHeader: any | null = React.useMemo(() => allColumns?.find((item) => item.id === 'selection') || null, [allColumns]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="custom-react-table custom-react-table-v1 vertical-center">
        <div className="table-container-v1" style={{ position: 'relative' }}>
          <GridHeader
            refreshGrid={refreshGrid}
            loading={loading}
            buttons={
              <>
                <ArrangeViewButton
                  defaultColumns={allColumns}
                  loading={loading}
                  columns={baseColumns}
                  renderedFrom={renderedFrom}
                  isClientSideGrid={isClientSideGrid}
                  setHiddenColumns={setHiddenColumns}
                  getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
                  setColumnOrder={setColumnOrder}
                  refColsOrder={newColumns}
                />
              </>
            }
          >
            <CustomReactTableHeaderOptions
              columns={baseColumns}
              customFilters = {customFilters}
              renderedFrom={renderedFrom}
              dispatchTable={dispatch}
              showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
              selectedRecords={selectedFlatRows?.length}
            />
            {/* Select All For Mobile */}
            {isMobileView && !hideSelection && mobileSelectAllHeader && (
              <>
                <label className="flex items-center gap-2 cursor-pointer -ml-2">
                  {mobileSelectAllHeader.render('Header')} <span>Select All</span>
                </label>
              </>
            )}
          </GridHeader>

          {/* Table */}
          {!isMobileView && (
            <div
              style={{
                display: 'block',
                overflow: 'auto',
                height: height ?? '100%'
              }}
              className="border "
            >
              {loading && (
                <Box
                  bgcolor={'rgba(255,255,255,0.2)'}
                  width="100%"
                  height="100%"
                  zIndex={100}
                  position="absolute"
                  top={0}
                  left={0}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Box textAlign="center">
                    <CircularProgress color="inherit" />
                    <p>Loading...</p>
                  </Box>
                </Box>
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
                  className="body"
                >
                  {rows.map((row, index1) => {
                    prepareRow(row);
                    return (
                      <TableRow key={index1} {...row.getRowProps()} className="tr">
                        {row.cells.map((cell, index2) => {
                          return (
                            <TableCell
                              key={index2}
                              {...cell.getCellProps()}
                              className={`td   ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''}    ${
                                setWholeRowsCellColor ? setWholeRowsCellColor(row.original) : ''
                              }`}
                            >
                              {!['selection'].includes(cell?.column.id) &&
                              rowState &&
                              rowState.hasOwnProperty(row.id) &&
                              rowState[row.id].cellState[cell?.column.id]?.isEditing ? (
                                <input
                                  autoFocus
                                  onBlur={submitInput}
                                  style={{
                                    borderLeft: '0',
                                    borderTop: '0',
                                    padding: '2px 4px',
                                    width: cell?.column.width - 20,
                                    background: 'transparent',
                                    outline: 'none'
                                  }}
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                />
                              ) : isCellEditing && currentRowEditing && currentRowEditing.id === row.id && cell?.column.id === 'action' ? (
                                <HtmlTooltip title="Save">
                                  <IconButton size="small" aria-label="Save" onClick={submitInput}>
                                    <Check color="primary" />
                                  </IconButton>
                                </HtmlTooltip>
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
              </MaUTable>
            </div>
          )}
        </div>

        {isMobileView ? (
          <SwipableListForMobile
            key={pageIndex}
            prepareRow={prepareRow}
            allColumns={allColumns}
            allowSelection={!hideSelection}
            dataRows={rows}
            dispatch={dispatch}
            loading={loading}
            page={currentPage}
            rowCount={rowCount}
            expander={expander}
            backgroundColor={setWholeRowsCellColor}
            renderedFrom={renderedFrom}
            handleCellSelection={handleCellSelection}
            IndeterminateCheckbox={IndeterminateCheckbox}
            toggleAllRowsSelected={toggleAllRowsSelected}
          />
        ) : null}
        {/* {allowPagination && (
          <TablePagination
            component="div"
            count={rowCount}
            page={pageIndex}
            onPageChange={(event, newPage) => {
              gotoPage(newPage);
              dispatch({ type: 'pageChange', page: newPage });
            }}
            rowsPerPage={limit}
            onRowsPerPageChange={(event) => {
              dispatch({ type: 'pageSizeChange', limit: event.target.value });
            }}
            rowsPerPageOptions={gridPageSizes}
          />
        )} */}
        {allowPagination && (
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
  const { id, Header } = column;
  const [filters, setFilters] = useState(() => {
    if (Object.keys(customFilters).length === 0) {
      return [];
    } else {
      return Object.keys(customFilters).map((key, i) => {
        return { id: key, value: customFilters[key].filter };
      });
    }
  });

  const debouncedFilterDispatch = debounce((updatedCustomFilters) => {
    dispatch({ type: 'filter', filters: updatedCustomFilters });
  }, 600);

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
    if (!isClientSideGrid) {
      let tempArray = Object.keys(customFilters).map((key, i) => {
        return { id: key, value: customFilters[key].filter };
      });
      if (JSON.stringify(filters) !== JSON.stringify(tempArray)) {
        var tempResult = {};
        filters?.forEach((v) => {
          if (v.value && v.value !== '') {
            tempResult[v.id] = { filter: v.value };
          }
        });
        debouncedFilterDispatch(tempResult);
      }
    }
  }, [filters]);

  drag(drop(ref));

  return (
    <TableCell {...column.getHeaderProps()} className="th text-truncate table-header">
      <div ref={ref} className="d-flex align-items-center justify-content-space-between pos-rel" style={{ width: '100%' }}>
        <div
          style={{ opacity: isDragging ? 0.2 : 1 }}
          className="d-flex gap-2 align-items-center"
          {...column.getSortByToggleProps({ title: undefined })}
        >
          <span>{column.render('Header')}</span>
          {column.isSorted ? column.isSortedDesc ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> : ''}
        </div>
        <div>
          {column.canFilter ? (
            <TempFilter
              filterValue={filters.find((filter) => filter.id === column.id)?.value || ''}
              id={column?.id}
              setFilters={setFilters}
              customFilters={customFilters}
            />
          ) : null}
        </div>
      </div>
      <div {...column.getResizerProps()} className="resizer" />
    </TableCell>
  );
};

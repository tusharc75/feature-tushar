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
import { generateUniqueId, gridPageSizes, treeToFlatArray } from '../../constants/helpers';
import { uniqBy, isString } from 'lodash';
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
import FilterListIcon from '@material-ui/icons/FilterList';
import CustomReactTableHeaderOptions from './CustomReactTableHeaderOptions';
import { isMobile, isTablet } from 'react-device-detect';
import Checkbox from '@material-ui/core/Checkbox';
import { DndProvider, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { XYCoord } from 'dnd-core';
import HtmlTooltip from '../CustomTooltipTitle';
import ArrangeViewButton from './ArrangeViewButton';
import { GrFormClose } from 'react-icons/gr';
import { CgSearch } from 'react-icons/cg';

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

// function DefaultColumnFilter({
//   column: {
//     filterValue,
//     // preFilteredRows,
//     setFilter
//   }
// }) {
//   // const count = preFilteredRows.length
//   return (
//     <TextField
//       autoComplete="off"
//       type="search"
//       id="search"
//       style={{ padding: 0 }}
//       fullWidth
//       value={filterValue || ''}
//       size="small"
//       InputProps={{
//         startAdornment: <FilterListIcon fontSize="small" className="mr-2" />
//       }}
//       onChange={(e) => {
//         setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
//       }}
//     />
//   );
// }

function DefaultColumnFilter({
  column: {
    filterValue,
    // preFilteredRows,
    setFilter
  }
}) {
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

  // const count = preFilteredRows.length
  return (
    <div>
      <IconButton onClick={() => setIsOpen(true)} size="small" className={`${filterValue ? 'activeFilter' : ''}`}>
        <CgSearch />
      </IconButton>
      {/* {isOpen && ( */}
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
        {/* {filterValue !== '' && ( */}
        <GrFormClose
          onClick={() => {
            setFilter('');
            setIsOpen(false);
          }}
        />
        {/* )} */}
      </div>
      {/* )} */}
    </div>
  );
}

const EditableCell = ({ value: initialValue, row: { index }, column: { id }, updateData }) => {
  const [value, setValue] = React.useState(initialValue);
  const onChange = (e) => {
    setValue(e.target.value);
  };

  // We'll only update the external data when the input is blurred
  const onBlur = () => {
    updateData(index, id, value);
  };

  // If the initialValue is changed external, sync it up with our state
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return <input value={value} onChange={onChange} onBlur={onBlur} />;
};

function CustomReactTable({
  columns,
  data,
  onSelect,
  setWholeRowsCellColor = null, // Use this prop when you want to change whole row's cell color.
  childrenProperty,
  uniqueKey,
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
  dispatch,
  sorting,
  loading
  // customPageSize = 20,
}) {
  const defaultColumn = {
    Cell: EditableCell,
    // When using the useFlexLayout:
    minWidth: 80, // minWidth is only used as a limit for resizing
    width: 150, // width is used for both the flex-basis and flex-grow
    // maxWidth: 250, // maxWidth is only used as a limit for resizing
    Filter: DefaultColumnFilter
  };

  const [cellValue, setCellValue] = React.useState('');
  const [isCellEditing, setIsCellEditing] = React.useState(false);
  const [currentRowEditing, setCurrentRowEditing] = React.useState(null);
  const [baseColumns, setBaseColumns] = React.useState([]);

  useEffect(() => {
    setBaseColumns(columns);
  }, [columns]);

  const newColumns = React.useMemo(
    () =>
      expander
        ? [
          {
            id: 'expander', // Make sure it has an ID
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
            //maxWidth: 70,
            canDrag: false,
            Cell: ({ row }) =>
              row.canExpand ? (
                <span
                  {...row.getToggleRowExpandedProps({
                    style: {
                      paddingLeft: `${row.depth * 2}rem`
                    }
                  })}
                >
                  {row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
                </span>
              ) : null
          },
          {
            id: 'selection',
            minWidth: 50,
            width: 50,
            maxWidth: 50,
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} style={{ marginLeft: '7px' }} />
            ),
            Cell: ({ row }) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
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
              <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} style={{ marginLeft: '7px' }} />
            ),
            Cell: ({ row }) => <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
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

  const updateData = () => { };

  const {
    getTableProps,
    getTableBodyProps,
    rows,
    headerGroups,
    footerGroups,
    prepareRow,
    allColumns,
    setHiddenColumns,
    getToggleHideAllColumnsProps,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    pageSize,
    setPageSize,
    selectedFlatRows,
    toggleRowExpanded,
    toggleAllRowsExpanded,
    setColumnOrder,
    setRowState,
    setCellState,
    state: {
      rowState,
      pageIndex,
      filters,
      sortBy,
      // pageSize,
      selectedRowIds,
      columnOrder
      // expanded,
    }
  } = useTable(
    {
      columns: newColumns,
      data,
      onSelect,
      defaultColumn,
      filterTypes,
      initialState: {
        columnOrder: newColumns.map((col) => col?.id || col?.accessor),
        filters: Object.keys(customFilters).map((key, i) => {
          return { id: key, value: customFilters[key].filter };
        }),
        sortBy: sorting.map((d) => {
          return { id: d.colId, desc: d.sort === 'asc' ? false : true };
        }),
        pageIndex: currentPage,
        autoResetExpanded: false,
        hiddenColumns: hideSelection ? ['selection', 'action'] : [],
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
          // else {
          //     dispatch({
          //         type: 'sort',
          //         sorting: [{ colId: columnName, sort: desc ? 'desc' : 'asc' }]
          //     });
          // }
        }
      },
      updateData
    },
    useFlexLayout,
    useColumnOrder,
    useResizeColumns,
    useFilters,
    useSortBy,
    useExpanded, // Use the useExpanded plugin hook
    usePagination,
    useRowSelect,
    useSticky,
    useRowState
  );

  useEffect(() => {
    //  Suggested by aman - 16-Nov-2021 - PO-174
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
        dispatch({ type: 'filter', filters: tempResult });
      }
    }
  }, [filters]);

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
    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([...flatSelectedData]));
    dispatch({
      type: 'selection',
      selectedRecords: [...flatSelectedData]
    });
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
    if (!allColumns || !Array.isArray(allColumns)) return;
    let timeout = setTimeout(() => {
      let newColumnState = [];
      allColumns.forEach((f) => {
        let object = {};

        Object.keys(f).forEach((ff) => {
          if (typeof f[ff] !== 'function' && typeof f[ff] !== 'object') {
            object[ff] = f[ff];
          }
        });

        newColumnState.push(object);
      });

      localStorage.setItem(renderedFrom, JSON.stringify(newColumnState));
    }, 500);

    return () => clearTimeout(timeout);
    // localStorage.setItem(renderedFrom, newColumns);
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

  // Render the UI for your table
  return (
    <div className="custom-react-table custom-react-table-v1 vertical-center">
      <CustomReactTableHeaderOptions
        columns={baseColumns}
        // setSelectedReportView={setSelectedReportView}
        // selectedReportView={selectedReportView}
        // columns={columns}
        // setColumns={setColumns}
        // columnApi={columnApi}
        // refreshGrid={refreshGrid}
        renderedFrom={renderedFrom}
        isClientSideGrid={isClientSideGrid}
        // dispatch={dispatch}
        showOnlyShowFilteredRecordSwitch={false}
        selectedRecords={selectedFlatRows.length ?? 0}
        setHiddenColumns={setHiddenColumns}
        getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
        setColumnOrder={setColumnOrder}
      />

      <div className="table-container-v1" style={{ position: 'relative' }}>
        <ArrangeViewButton
          columns={baseColumns}
          renderedFrom={renderedFrom}
          isClientSideGrid={isClientSideGrid}
          setHiddenColumns={setHiddenColumns}
          getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
          setColumnOrder={setColumnOrder}
        />
        <div
          style={{
            display: 'block',
            overflow: 'auto',
            height: height ?? '100%'
            // maxWidth: "100%",
            // overflowX: "scroll",
            // overflowY: "hidden",
            // borderBottom: "1px solid black"
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
          <DndProvider backend={HTML5Backend}>
            <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
              <TableHead style={{ overflowY: 'auto', overflowX: 'hidden' }} className="header">
                {headerGroups.map((headerGroup, index) => (
                  <React.Fragment key={index}>
                    <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                      {headerGroup.headers.map((column, index) => (
                        <>
                          <DraggableHeader key={column.id} column={column} reorder={reorder} index={index} />
                        </>
                      ))}
                    </TableRow>
                    {/* <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                      {headerGroup.headers.map((column) => (
                        <TableCell key={column.Header} {...column.getHeaderProps()} className="th text-truncate bg-white">
                          <div>{column.canFilter ? column.render('Filter') : null}</div>
                        </TableCell>
                      ))}
                    </TableRow> */}
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
                            onDoubleClick={() => {
                              // setRowState(row.id, { ...row, original: { ...row.original, isEditing: true } });
                              // Object.keys(rowState).forEach((k) => {
                              //   if (row.id !== k) {
                              //     setRowState(k, { ...rowState[k], original: { ...rowState[k].original, isEditing: false } });
                              //   }
                              // });
                              // setCellValue(cell?.value || '');
                              // setIsCellEditing(true);
                              // setCurrentRowEditing(row);
                              // setCellState(row.id, cell.column.id, { isEditing: true });
                              // Object.keys(rowState).forEach((rowId) => {
                              //   Object.keys(rowState[rowId].cellState).forEach((colId) => {
                              //     if (rowState[rowId]?.cellState[colId] !== cell.column?.id && rowState[rowId]?.cellState[colId]?.isEditing) {
                              //       setCellState(rowId, colId, { isEditing: false });
                              //     }
                              //   });
                              // });
                            }}
                            key={index2}
                            {...cell.getCellProps()}
                            className={`td   ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''}    ${setWholeRowsCellColor ? setWholeRowsCellColor(row.original) : ''
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
              {rows?.length > 0 && (
                <TableFooter style={{ overflowY: 'auto', overflowX: 'hidden' }} className="footer">
                  {footerGroups.map((group, index) => (
                    <TableRow key={index} {...group.getFooterGroupProps()} className="tr">
                      {group.headers.map((column, index1) => (
                        <TableCell key={index1} {...column.getHeaderProps()} className="th text-truncate font-weight-bold text-black">
                          {column.render('Footer')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableFooter>
              )}
            </MaUTable>
          </DndProvider>
        </div>
      </div>
      {allowPagination && !loading && (
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
      )}
    </div>
  );
}

export default CustomReactTable;

const ItemTypes = {
  COLUMN: 'COLUMN'
};

const DraggableHeader = ({ column, index, reorder }: { column: any; index: number; reorder: (item: any, index: number) => void }) => {
  const ref = React.useRef();
  const { id, Header } = column;

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

  drag(drop(ref));

  return (
    <TableCell {...column.getHeaderProps()} className="th text-truncate table-header">
      <div className="d-flex align-items-center justify-content-space-between pos-rel" style={{ width: '100%' }}>
        <div style={{ opacity: isDragging ? 0.2 : 1 }} className="d-flex gap-2 align-items-center" {...column.getSortByToggleProps({ title: undefined })}>
          <span>{column.render('Header')}</span>
          {column.isSorted ? column.isSortedDesc ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> : ''}
        </div>
        <div>{column.canFilter ? column.render('Filter') : null}</div>
      </div>
      <div {...column.getResizerProps()} className="resizer" />
    </TableCell>
  );
};

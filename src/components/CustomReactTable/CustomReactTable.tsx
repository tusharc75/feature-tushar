import React, { useEffect, useState } from 'react';
import MaUTable from '@material-ui/core/Table';
import { TableBody, TableCell, TableHead, TableFooter, TableRow, TextField, IconButton } from '@material-ui/core';
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { columnFilter } from './ReactTableHelpers';
import { isString } from 'lodash';
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
  useRowState
} from 'react-table';
import { useSticky } from 'react-table-sticky';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import CustomReactTableHeaderOptions from './CustomReactTableHeaderOptions';
import { isMobile, isTablet } from 'react-device-detect';
import Checkbox from '@material-ui/core/Checkbox';
import HtmlTooltip from '../CustomTooltipTitle';
import { Check, Edit } from '@material-ui/icons';
import { CgSearch } from 'react-icons/cg';
import { GrFormClose } from 'react-icons/gr';
import { flattenArray } from 'src/constants/columns';

const IndeterminateCheckbox = React.forwardRef(({ indeterminate, from, ...rest }: any, ref) => {
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
      style={from === 'Header' ? { padding: '0px' } : { padding: '0px' }}
      inputProps={{ 'aria-label': 'secondary checkbox' }}
    />
    // <>
    //     <input type="checkbox" ref={resolvedRef} {...rest} />
    // </>
  );
});

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

export default function CustomReactTable({
  columns,
  data,
  onSelect,
  setWholeRowsCellColor = null, // Use this prop when you want to change whole row's cell color.
  childrenProperty,
  uniqueKey,
  height = '100%',
  hideSelection = false,
  hideAction = false,
  renderedFrom,
  isClientSideGrid,
  // rowCount,
  // customPageSize = 20,
  displayCustomReactTableHeaderOptions = true,
  hideExpander = false,
  onSaveEdit = null
}) {
  const defaultColumn = React.useMemo(
    () => ({
      minWidth: 80,
      width: 150,
      Filter: DefaultColumnFilter
    }),
    []
  );

  const [cellValue, setCellValue] = React.useState(null);
  const [isCellEditing, setIsCellEditing] = React.useState(false);
  const [currentRowEditing, setCurrentRowEditing] = React.useState(null);

  useEffect(() => {
    setIsCellEditing(false);
    setCurrentRowEditing(null);
    setCellValue(null);
  }, [data]);

  const newColumns = React.useMemo(
    () =>
      hideExpander
        ? [
            {
              id: 'selection',
              sticky: 'left',
              width: 100,
              minWidth: 100,
              canDrag: false,
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <div>
                  <IndeterminateCheckbox from="Header" {...getToggleAllRowsSelectedProps()} />
                </div>
              ),
              Cell: ({ row }) =>
                row?.original?.hideSelection ? null : (
                  <div style={{ paddingLeft: row.depth > 0 ? `${row.depth * 2}rem` : '' }}>
                    <IndeterminateCheckbox from="Cell" {...row.getToggleRowSelectedProps()} />
                  </div>
                )
            },
            ...columns.map((m) => {
              return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' };
            })
          ]
        : [
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
                      className="cursor-pointer"
                      onClick={() => {
                        toggleAllRowsExpanded(false);
                      }}
                    />
                  ) : (
                    <FaAngleRight
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

            //  Use below selection if pagination is there
            // {
            //     id: 'selection',
            //     minWidth: 50,
            //     width: 50,
            //     maxWidth: 50,
            //     // The header can use the table's getToggleAllRowsSelectedProps method
            //     // to render a checkbox
            //     Header: ({ getToggleAllPageRowsSelectedProps }) => (
            //         <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
            //     ),
            //     // The cell can use the individual row's getToggleRowSelectedProps method
            //     // to the render a checkbox
            //     Cell: ({ row }) => (
            //         <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
            //     ),
            // },

            //  Use below selection if pagination is not there
            {
              id: 'selection',
              sticky: 'left',
              width: 100,
              minWidth: 100,
              canDrag: false,
              Header: ({ getToggleAllRowsSelectedProps }) => (
                <div>
                  <IndeterminateCheckbox from="Header" {...getToggleAllRowsSelectedProps()} />
                </div>
              ),
              Cell: ({ row }) =>
                row?.original?.hideSelection ? null : (
                  <div style={{ paddingLeft: row.depth > 0 ? `${row.depth * 2}rem` : '' }}>
                    <IndeterminateCheckbox from="Cell" {...row.getToggleRowSelectedProps()} />
                  </div>
                )
            },
            ...columns.map((m) => {
              return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' };
            })
          ],
    []
  );

  const filterTypes = React.useMemo(() => ({ filterRowsWithSubrows: (rows, id, filterValue) => columnFilter(rows, id, filterValue) }), []);

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
    // page,
    // canPreviousPage,
    // canNextPage,
    // // pageOptions,
    // pageCount,
    // gotoPage,
    // nextPage,
    // previousPage,
    // setPageSize,
    selectedFlatRows,
    toggleRowExpanded,
    toggleAllRowsExpanded,
    setCellState,
    setColumnOrder,
    state: {
      // pageIndex,
      // pageSize,
      selectedRowIds,
      // expanded,
      rowState
    }
  } = useTable(
    {
      columns: newColumns,
      data,
      onSelect,
      defaultColumn,
      filterTypes,
      initialState: {
        // pageIndex: 0,
        autoResetExpanded: false,
        hiddenColumns: hideSelection && hideAction ? ['selection', 'action'] : hideSelection ? ['selection'] : hideAction ? ['action'] : [],
        expanded: false
      },
      getSubRows: (row: any) => row.subRows,
      sortTypes: {
        alphanumeric: (row1, row2, columnName) => {
          const rowOneColumn = row1.values[columnName];
          const rowTwoColumn = row2.values[columnName];
          if (isString(rowOneColumn)) {
            return rowOneColumn?.toUpperCase() > rowTwoColumn?.toUpperCase() ? 1 : -1;
          }
          return Number(rowOneColumn) > Number(rowTwoColumn) ? 1 : -1;
        }
      }
    },
    useFlexLayout,
    useColumnOrder,
    useResizeColumns,
    useFilters,
    useSortBy,
    useExpanded, // Use the useExpanded plugin hook
    // usePagination,
    useRowSelect,
    useSticky,
    useRowState
  );

  useEffect(() => {
    try {
      const storedColumns = localStorage.getItem(renderedFrom);
      if (storedColumns) {
        setColumnOrder(JSON.parse(storedColumns).map((m) => m.id));
        setHiddenColumns(
          JSON.parse(storedColumns)
            .filter((f) => f.isVisible === false && !['expander', 'selection']?.includes(f.id))
            .map((m) => m.id)
        );
      }
    } catch (ex) {
      console.error(`Error while getting stored data from local storage - ${renderedFrom}`);
    }
  }, []);

  useEffect(() => {
    let flatSelectedData = [];
    Object.keys(selectedRowIds).forEach((key) => {
      const splittedArray = key.split('.');
      if (splittedArray.length === 0) {
        const { subRows, ...rest } = data[key];
        flatSelectedData.push({ ...rest });
      } else {
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
  }, [selectedRowIds]);

  const submitInput = () => {
    const rowData = Object.keys(rowState[currentRowEditing.id].cellState).filter((k) => rowState[currentRowEditing.id].cellState[k].isEditing);
    const updatedData = flattenArray(data)?.find((row) => row?._id == currentRowEditing?.original?._id);
    updatedData[rowData[0]] = cellValue;
    const inputField = { [`${rowData[0]}`]: cellValue };
    if (onSaveEdit && cellValue > -1 && ![undefined, null].includes(cellValue)) {
      onSaveEdit(inputField, updatedData);
    }
    Object.keys(rowState).forEach((rowId) => {
      Object.keys(rowState[rowId].cellState).forEach((colId) => {
        setCellState(rowId, colId, { isEditing: false });
      });
    });
    setIsCellEditing(false);
    setCurrentRowEditing(null);
    setCellValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitInput();
    }
  };
  // Render the UI for your table
  return (
    <div style={{ position: 'relative' }} className="custom-react-table-v1  vertical-center">
      {displayCustomReactTableHeaderOptions && (
        <CustomReactTableHeaderOptions
          columns={allColumns}
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
      )}
      <div
        style={{
          display: 'block',
          overflow: 'auto',
          background: 'white',
          height: height ?? '100%'
          // maxWidth: "100%",
          // overflowX: "scroll",
          // overflowY: "hidden",
          // borderBottom: "1px solid black"
        }}
        className="border custom-react-table "
      >
        <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
          <TableHead style={{ overflowY: 'auto', overflowX: 'hidden' }} className="header">
            {headerGroups.map((headerGroup, index) => (
              <>
                <TableRow {...headerGroup.getHeaderGroupProps()} key={index} className="tr">
                  {headerGroup.headers.map((column, index) => (
                    <TableCell
                      key={`${index}-${column?.Header}`}
                      {...column.getHeaderProps()}
                      className="th text-truncate table-header overflow-initial"
                    >
                      <div className="d-flex align-items-center justify-content-space-between pos-rel">
                        <div className="d-flex gap-2 align-items-center" {...column.getSortByToggleProps()}>
                          <span>{column.render('Header')}</span>
                          {column.isSorted ? column.isSortedDesc ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" /> : ''}
                        </div>
                        <div>{column.canFilter ? column.render('Filter') : null}</div>
                      </div>
                      <div {...column.getResizerProps()} className="resizer" />
                    </TableCell>
                  ))}
                </TableRow>
                {/* <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                  {headerGroup.headers.map((column) => (
                    <TableCell {...column.getHeaderProps()} className="th text-truncate bg-white">
                      <div>{column.canFilter ? column.render('Filter') : null}</div>
                    </TableCell>
                  ))}
                </TableRow> */}
              </>
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
            {rows.map((row, index) => {
              prepareRow(row);
              return (
                <TableRow {...row.getRowProps()} className="tr">
                  {row.cells.map((cell) => {
                    return (
                      <TableCell
                        onDoubleClick={() => {
                          if (!cell?.column?.editable) return;
                          setCellValue(parseFloat(cell?.value) || null);
                          setIsCellEditing(true);
                          setCurrentRowEditing(row);
                          setCellState(row.id, cell.column.id, { isEditing: true });
                          Object.keys(rowState).forEach((rowId) => {
                            Object.keys(rowState[rowId].cellState).forEach((colId) => {
                              if (rowState[rowId]?.cellState[colId] !== cell.column?.id && rowState[rowId]?.cellState[colId]?.isEditing) {
                                setCellState(rowId, colId, { isEditing: false });
                                // setIsCellEditing(false);
                              }
                            });
                          });
                        }}
                        onKeyDown={(e) => {
                          if (isCellEditing && currentRowEditing && currentRowEditing.id === row.id) {
                            handleKeyDown(e);
                          }
                        }}
                        {...cell.getCellProps()}
                        className={`td ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ''} ${
                          setWholeRowsCellColor ? setWholeRowsCellColor(row.original) : ''
                        }`}
                      >
                        {!['selection'].includes(cell?.column.id) &&
                        rowState &&
                        rowState.hasOwnProperty(row.id) &&
                        rowState[row.id].cellState[cell?.column.id]?.isEditing ? (
                          <input
                            type="number"
                            autoFocus
                            style={{
                              borderLeft: '0',
                              borderTop: '0',
                              padding: '2px 4px',
                              width: cell?.column.width - 20,
                              background: 'transparent',
                              outline: 'none'
                            }}
                            value={cellValue}
                            onChange={(e) => {
                              let value: any = e.target.value;
                              value = parseFloat(parseFloat(value)?.toFixed(cell?.column?.decimalPlaces || 0));
                              if (value < 0) return;
                              setCellValue(value);
                            }}
                          />
                        ) : isCellEditing && currentRowEditing && currentRowEditing.id === row.id && cell?.column.id === 'action' ? (
                          <HtmlTooltip title="Save">
                            <IconButton size="small" aria-label="Save" onClick={submitInput}>
                              <Check color="primary" />
                            </IconButton>
                          </HtmlTooltip>
                        ) : cell.column?.editable && cell?.value ? (
                          <div style={{ borderBottom: '1px dashed #8a8a8a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                            <p>{cell?.value}</p>
                            <span>
                              <Edit color="disabled" fontSize="small" />
                            </span>
                          </div>
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
      {/* <TablePagination
        component="div"
        count={data.length}
        page={pageIndex}
        onPageChange={(event, newPage) => {
          gotoPage(newPage);
        }}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(event) => {
          setPageSize(event.target.value)
        }}
        rowsPerPageOptions={gridPageSizes}
      /> */}
    </div>
  );
}

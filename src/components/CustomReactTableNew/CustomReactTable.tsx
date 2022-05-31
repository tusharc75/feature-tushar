
import React, { useEffect, useState } from 'react'
import MaUTable from '@material-ui/core/Table'
import { TableBody, TableCell, TableHead, TableFooter, TableRow, TextField, TablePagination, Box, CircularProgress } from '@material-ui/core'
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { columnFilter } from './ReactTableHelpers'
import { generateUniqueId, gridPageSizes, treeToFlatArray } from '../../constants/helpers'
import { uniqBy, isString } from 'lodash';
import {
    useTable, useExpanded, useRowSelect, useFlexLayout,
    useSortBy, useResizeColumns, useFilters, useColumnOrder, usePagination
} from 'react-table'
import { useSticky } from "react-table-sticky";
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FilterListIcon from '@material-ui/icons/FilterList';
import CustomReactTableHeaderOptions from './CustomReactTableHeaderOptions';
import { isMobile, isTablet } from "react-device-detect";
import Checkbox from "@material-ui/core/Checkbox"
import { DndProvider, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { XYCoord } from 'dnd-core';

const IndeterminateCheckbox = React.forwardRef(
    ({ indeterminate, from, ...rest }: any, ref) => {
        const defaultRef = React.useRef()
        const resolvedRef: any = ref || defaultRef
        useEffect(() => {
            resolvedRef.current.indeterminate = indeterminate
        }, [resolvedRef, indeterminate])
        return (
            <Checkbox
                size="small"
                ref={resolvedRef}
                {...rest}
                defaultChecked={false}
                color="primary"
                style={from === "Header" ? { padding: "0px", color: 'white' } : { padding: "0px" }}
                inputProps={{ 'aria-label': 'secondary checkbox' }}
            />
        )
    }
)


function DefaultColumnFilter({
    column: {
        filterValue,
        // preFilteredRows,
        setFilter
    },
}) {
    // const count = preFilteredRows.length
    return (
        <TextField
            autoComplete="off"
            type="search"
            id="search"
            style={{ padding: 0 }}
            fullWidth
            value={filterValue || ''}
            size="small"
            InputProps={{
                startAdornment: <FilterListIcon fontSize="small" className="mr-2" />,
            }}
            onChange={e => {
                setFilter(e.target.value || undefined) // Set undefined to remove the filter entirely
            }}
        />
    )
}

export default function CustomReactTable({
    columns,
    data,
    onSelect,
    setWholeRowsCellColor = null,   // Use this prop when you want to change whole row's cell color.
    childrenProperty,
    uniqueKey,
    height = "100%",
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
    const defaultColumn = React.useMemo(
        () => ({
            // When using the useFlexLayout:
            minWidth: 80, // minWidth is only used as a limit for resizing
            width: 150, // width is used for both the flex-basis and flex-grow
            // maxWidth: 250, // maxWidth is only used as a limit for resizing
            Filter: DefaultColumnFilter,
        }),
        []
    )

    const newColumns = React.useMemo(
        () => expander ? [
            {
                id: 'expander', // Make sure it has an ID
                Header: ({ isAllRowsExpanded }) => (
                    <span style={{
                        paddingLeft: "0.3rem",
                        color: "black"
                    }}>
                        {
                            isAllRowsExpanded ? <FaAngleDown style={{ color: "white" }} className="cursor-pointer" onClick={() => {
                                toggleAllRowsExpanded(false);
                            }} /> : <FaAngleRight style={{ color: "white" }} className="cursor-pointer" onClick={() => {
                                toggleAllRowsExpanded(true);
                            }} />
                        }
                    </span>
                ),
                sticky: "left",
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
                                },
                            })}
                        >
                            {row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
                        </span>
                    ) : null,
            },
            {
                id: 'selection',
                minWidth: 50,
                width: 50,
                maxWidth: 50,
                Header: ({ getToggleAllRowsSelectedProps }) => (
                    <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                ),
                Cell: ({ row }) => (
                    <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                ),
            },
            ...columns.map(m => { return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' } })
        ]
            : [{
                id: 'selection',
                minWidth: 50,
                width: 50,
                maxWidth: 50,
                Header: ({ getToggleAllRowsSelectedProps }) => (
                    <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                ),
                Cell: ({ row }) => (
                    <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                ),
            },
            ...columns.map(m => { return m.canFilter ? { ...m } : { ...m, filter: 'filterRowsWithSubrows' } })
            ],
        []
    )

    const filterTypes = React.useMemo(
        () => ({
            filterRowsWithSubrows: (rows, id, filterValue) => columnFilter(rows, id, filterValue)
        }),
        [],
    );

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
        state: {
            pageIndex,
            filters,
            sortBy,
            // pageSize,
            selectedRowIds
            // expanded
        },
    } = useTable(
        {
            columns: newColumns,
            data,
            onSelect,
            defaultColumn,
            filterTypes,
            initialState: {
                filters: Object.keys(customFilters).map((key, i) => { return { id: key, value: customFilters[key].filter } }),
                sortBy: sorting.map((d) => { return { id: d.colId, desc: d.sort === 'asc' ? false : true } }),
                pageIndex: currentPage,
                autoResetExpanded: false,
                hiddenColumns: hideSelection ? ["selection", "action"] : [],
                selectedRowIds: localStorage.getItem(`${renderedFrom}_selected`) ? Object.assign({}, data.map(d => JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)).some(obj => obj._id === d._id))) : {}
            },
            getSubRows: (row: any) => row.subRows,
            sortTypes: {
                alphanumeric: (row1, row2, columnName, desc: boolean) => {
                    if (isClientSideGrid) {
                        const rowOneColumn = row1.values[columnName];
                        const rowTwoColumn = row2.values[columnName];
                        if (isString(rowOneColumn)) {
                            return rowOneColumn?.toUpperCase() >
                                rowTwoColumn?.toUpperCase()
                                ? 1
                                : -1;
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
            }
        },
        useFlexLayout,
        useColumnOrder,
        useResizeColumns,
        useFilters,
        useSortBy,
        useExpanded, // Use the useExpanded plugin hook
        usePagination,
        useRowSelect,
        useSticky
    )

    useEffect(() => {
        //  Suggested by aman - 16-Nov-2021 - PO-174
        rows.forEach((d) => {
            if (d.subRows && d.subRows.length < 20) {
                toggleAllRowsExpanded(true);
                toggleRowExpanded(d.id, true)
            }
        })

        try {
            const storedColumns = localStorage.getItem(renderedFrom)
            if (storedColumns) {
                setColumnOrder(JSON.parse(storedColumns).map(m => m.id));
                setHiddenColumns(JSON.parse(storedColumns).filter(f => f.isVisible === false).map(m => m.id))
            }
        } catch (ex) {
            console.error(`Error while getting stored data from local storage - ${renderedFrom}`)
        }
    }, [])

    useEffect(() => {
        if (!isClientSideGrid) {
            let tempArray = Object.keys(customFilters).map((key, i) => { return { id: key, value: customFilters[key].filter } })
            if (JSON.stringify(filters) !== JSON.stringify(tempArray)) {
                var tempResult = {}
                filters?.forEach((v) => {
                    if (v.value && v.value !== "") {
                        tempResult[v.id] = { filter: v.value };
                    }
                })
                dispatch({ type: 'filter', filters: tempResult });
            }
        }

    }, [filters])

    useEffect(() => {
        if (!isClientSideGrid) {
            let tempArray = sorting.map((d) => { return { id: d.colId, desc: d.sort === 'asc' ? false : true } })
            if (JSON.stringify(sortBy) !== JSON.stringify(tempArray)) {
                sortBy?.forEach((v) => {
                    dispatch({
                        type: 'sort',
                        sorting: [{ colId: v.id, sort: v.desc ? 'desc' : 'asc' }]
                    });
                })
            }
        }

    }, [sortBy])

    useEffect(() => {
        let flatSelectedData = [];
        Object.keys(selectedRowIds).forEach((key) => {
            const splittedArray = key.split(".");
            if (splittedArray.length <= 1 && selectedRowIds[key]) {
                const { subRows, ...rest } = data[key];
                flatSelectedData.push({ ...rest })
            } else if (selectedRowIds[key]) {
                let dataToStore = null;
                splittedArray.forEach((f, index) => {
                    if (index === 0) {
                        dataToStore = { ...data[f] };
                    } else {
                        dataToStore = { ...dataToStore["subRows"][f] };
                    }
                })
                const { subRows, ...rest } = dataToStore;
                flatSelectedData.push({ ...rest })
            }
        })
        onSelect([...flatSelectedData]);
        localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([...flatSelectedData]));
        dispatch({
            type: 'selection',
            selectedRecords: [...flatSelectedData]
        });
    }, [selectedRowIds]);

    const moveItem = React.useCallback(
        (dragIndex: number, hoverIndex: number) => {
            const dragCard = columns[dragIndex];

            const columnsForGrid = update(columns, {
                $splice: [
                    [dragIndex, 1],
                    [hoverIndex, 0, dragCard]
                ]
            });

            setColumnOrder([...columnsForGrid]);
        },
        [columns]
    );

    // Render the UI for your table
    return (
        <>
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

            <div style={{
                display: "block",
                overflow: "auto",
                height: height ?? "100%"
                // maxWidth: "100%",
                // overflowX: "scroll",
                // overflowY: "hidden",
                // borderBottom: "1px solid black"
            }} className="border custom-react-table">
                {loading && <Box bgcolor={'rgba(255,255,255,0.2)'} width="100%" height='100%' zIndex={100} position='absolute' top={0} left={0} display='flex' justifyContent="center" alignItems='center'>
                    <Box textAlign='center'>
                        <CircularProgress color='inherit' />
                        <p>Loading...</p>
                    </Box>
                </Box>}
                <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
                    <TableHead style={{ overflowY: "auto", overflowX: "hidden" }} className="header">
                        {headerGroups.map((headerGroup, index) => (
                            <>
                                <TableRow {...headerGroup.getHeaderGroupProps()} key={index} className="tr">
                                    <DndProvider backend={HTML5Backend}>
                                        {headerGroup.headers.map(column => (
                                            <RenderListItem
                                                key={column.id}
                                                column={column}
                                                moveItem={moveItem}
                                                index={index}
                                                id={column.id}
                                                columns={columns}
                                            />
                                        ))}
                                    </DndProvider>

                                </TableRow>
                                <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                                    {headerGroup.headers.map(column => (
                                        <TableCell {...column.getHeaderProps()} className="th text-truncate bg-white">
                                            <div>{column.canFilter ? column.render('Filter') : null}</div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </>
                        ))}
                    </TableHead>

                    <TableBody style={{
                        overflowY: "scroll",
                        overflowX: "hidden",
                        // height: "250px"
                    }} className="body">
                        {
                            rows.map((row, index) => {
                                prepareRow(row)
                                return (
                                    <TableRow {...row.getRowProps()} className="tr">
                                        {row.cells.map(cell => {
                                            return (
                                                <TableCell {...cell.getCellProps()} className={`td 
                                                    ${cell.column.setCellClassNames ? cell.column.setCellClassNames(row.original) : ""} 
                                                    ${setWholeRowsCellColor ? setWholeRowsCellColor(row.original) : ""}`}
                                                >
                                                    {cell.render('Cell')}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>
                    {rows?.length > 0 &&
                        <TableFooter style={{ overflowY: "auto", overflowX: "hidden" }} className="footer">
                            {footerGroups.map(group => (
                                <TableRow {...group.getFooterGroupProps()} className="tr">
                                    {group.headers.map(column => (
                                        <TableCell {...column.getHeaderProps()} className="th text-truncate font-weight-bold text-black">
                                            {column.render('Footer')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableFooter>
                    }
                </MaUTable>
            </div>
            {allowPagination && !loading && (<TablePagination
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
            />)}
        </>
    )
}
interface ItemProps {
    column: any;
    moveItem: CallableFunction;
    id: string;
    index: number;
    columns: any[];
}

interface DragItem {
    index: number;
    id: string;
    type: string;
}
const ItemTypes = {
    CARD: 'card'
};
const RenderListItem = (props: ItemProps) => {
    const { column, moveItem, id, index, columns } = props;

    const ref = React.useRef<HTMLDivElement>(null);
    const [{ handlerId }, drop] = useDrop({
        accept: ItemTypes.CARD,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId()
            };
        },
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            // Get pixels to the top
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            console.log(dragIndex + "  " + hoverIndex)
            moveItem(dragIndex, hoverIndex);
            item.index = hoverIndex;
        }
    });

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.CARD,
        item: () => {
            return { id, index };
        },
        collect: (monitor: any) => ({
            isDragging: monitor.isDragging(),
        })
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));

    return column.sticky ? <div className="d-none">

    </div> :
        <TableCell ref={ref} style={{ opacity }} data-handler-id={handlerId} {...column.getHeaderProps()} className="th text-truncate table-header">
            <div className="d-flex gap-2 align-items-center" {...column.getSortByToggleProps()}>
                <span>
                    {column.render('Header')}
                </span>
                {column.isSorted
                    ? column.isSortedDesc
                        ? <ExpandLessIcon fontSize="small" />
                        : <ExpandMoreIcon fontSize="small" />
                    : ''}
            </div>
            <div {...column.getResizerProps()} className="resizer" />
        </TableCell>

};
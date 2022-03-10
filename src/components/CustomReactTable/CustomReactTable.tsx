
import React, { useEffect } from 'react'
import MaUTable from '@material-ui/core/Table'
import { TableBody, TableCell, TableHead, TableFooter, TableRow, TextField } from '@material-ui/core'
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { columnFilter } from './ReactTableHelpers'
import { treeToFlatArray } from '../../constants/helpers'
import { uniqBy, isString } from 'lodash';
import {
    useTable, useExpanded, useRowSelect, useFlexLayout,
    useSortBy, useResizeColumns, useFilters, usePagination
} from 'react-table'
import { useSticky } from "react-table-sticky";
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FilterListIcon from '@material-ui/icons/FilterList';

const IndeterminateCheckbox = React.forwardRef(
    ({ indeterminate, ...rest }: any, ref) => {
        const defaultRef = React.useRef()
        const resolvedRef: any = ref || defaultRef

        useEffect(() => {
            resolvedRef.current.indeterminate = indeterminate
        }, [resolvedRef, indeterminate])

        return (
            // <Checkbox
            //     size="small"
            //     ref={resolvedRef} {...rest}
            //     defaultChecked={false}
            //     color="primary"
            //     inputProps={{ 'aria-label': 'secondary checkbox' }}
            // />
            <>
                <input type="checkbox" ref={resolvedRef} {...rest} />
            </>
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
    setCellColor = null,
    childrenProperty,
    uniqueKey,
    height = "100%",
    hideSelection = false
    // rowCount,
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
        () => [
            {
                // Build our expander column
                id: 'expander', // Make sure it has an ID
                Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded, rows }) => (
                    <span {...getToggleAllRowsExpandedProps({
                        style: {
                            paddingLeft: "0.3rem",
                            color: "black"
                        }
                    })}>
                        {
                            rows.some(d => d.canExpand) && (isAllRowsExpanded ? <FaAngleDown /> : <FaAngleRight />)
                        }
                    </span>
                ),
                sticky: "left",
                width: 70,
                minWidth: 70,
                maxWidth: 250,
                Cell: ({ row }) =>
                    // Use the row.canExpand and row.getToggleRowExpandedProps prop getter
                    // to build the toggle for expanding a row
                    row.canExpand ? (
                        <span
                            {...row.getToggleRowExpandedProps({
                                style: {
                                    // We can even use the row.depth property
                                    // and paddingLeft to indicate the depth
                                    // of the row
                                    paddingLeft: `${row.depth * 2}rem`
                                },
                            })}
                        >
                            {row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
                        </span>
                    ) : <div></div>,
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
                //  Check this example to customize checkbox
                //  https://github.com/tannerlinsley/react-table/issues/2988
                id: 'selection',
                sticky: "left",
                width: 100,
                minWidth: 100,
                maxWidth: 250,
                // The header can use the table's getToggleAllRowsSelectedProps method
                // to render a checkbox
                Header: ({ getToggleAllRowsSelectedProps }) => (
                    <div>
                        <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
                    </div>
                ),
                // The cell can use the individual row's getToggleRowSelectedProps method
                // to the render a checkbox
                Cell: ({ row }) => (
                    row?.original?.hideSelection ? null :
                        <div style={{ paddingLeft: row.depth > 0 ? `${row.depth * 2}rem` : "" }}>
                            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                        </div>
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
        // state: {
        //     pageIndex,
        //     pageSize,
        //     // selectedRowIds
        //     expanded
        // },
    } = useTable(
        {
            columns: newColumns,
            data,
            onSelect,
            defaultColumn,
            filterTypes,
            initialState: {
                // pageIndex: 0,
                autoResetExpanded: true,
                hiddenColumns: hideSelection ? ["selection", "action"] : []
            },
            getSubRows: (row: any) => row.subRows,
            sortTypes: {
                alphanumeric: (row1, row2, columnName) => {
                    const rowOneColumn = row1.values[columnName];
                    const rowTwoColumn = row2.values[columnName];
                    if (isString(rowOneColumn)) {
                        return rowOneColumn.toUpperCase() >
                            rowTwoColumn.toUpperCase()
                            ? 1
                            : -1;
                    }
                    return Number(rowOneColumn) > Number(rowTwoColumn) ? 1 : -1;
                }
            }
        },
        useFlexLayout,
        useResizeColumns,
        useFilters,
        useSortBy,
        useExpanded, // Use the useExpanded plugin hook
        // usePagination,
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
    }, [])

    // useEffect(() => {
    //     setPageSize(gridPageSizes[0])
    //     // setPageSize(gridPageSizes[0])
    // }, [setPageSize,])

    useEffect(() => {

        const flatData = treeToFlatArray(selectedFlatRows, childrenProperty);

        const flatSelectedData = [];
        flatData.filter(f => f.isSelected).forEach(({ original }) => {
            // const { subRows, ...d } = original;
            flatSelectedData.push(original)
        });

        if (flatSelectedData.every(s => s.hasOwnProperty(uniqueKey))) {
            onSelect([...uniqBy(flatSelectedData, uniqueKey)]);
        } else if (flatSelectedData.every(s => s.hasOwnProperty("_id"))) {
            onSelect([...uniqBy(flatSelectedData, "_id")]);
        } else {
            onSelect([...uniqBy(flatSelectedData, "id")]);
        }

    }, [selectedFlatRows.length]);

    // Render the UI for your table
    return (
        <>
            <div style={{
                display: "block",
                overflow: "auto",
                height: height ?? "100%"
                // maxWidth: "100%",
                // overflowX: "scroll",
                // overflowY: "hidden",
                // borderBottom: "1px solid black"
            }} className="border custom-react-table">
                <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
                    <TableHead style={{ overflowY: "auto", overflowX: "hidden" }} className="header">
                        {headerGroups.map(headerGroup => (
                            <>
                                <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                                    {headerGroup.headers.map(column => (
                                        <TableCell {...column.getHeaderProps()} className="th text-truncate">
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
                                    ))}
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
                                    <TableRow {...row.getRowProps()} key={row.original._id ?? index} className="tr">
                                        {row.cells.map(cell => {
                                            return (
                                                <TableCell {...cell.getCellProps()} className={`td ${setCellColor ? setCellColor(row.original) : ""}`}>
                                                    {cell.render('Cell')}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>

                    {
                        rows?.length > 0 &&
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

        </>
    )
}

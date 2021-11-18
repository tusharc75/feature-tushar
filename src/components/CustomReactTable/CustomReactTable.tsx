
import React, { useEffect } from 'react'
import { useTable, useExpanded, useRowSelect, usePagination, useFlexLayout } from 'react-table'

import MaUTable from '@material-ui/core/Table'
import { TableBody, TableCell, TableHead, TableFooter, TableRow } from '@material-ui/core'
import Checkbox from '@material-ui/core/Checkbox';
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { TablePagination } from '@material-ui/core'
import { gridPageSizes, treeToFlatArray } from '../../constants/helpers'
import { uniqBy } from 'lodash';

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

export default function CustomReactTable({
    columns,
    data,
    onSelect,
    rowStyle,
    childrenProperty,
    uniqueKey,
    height = "100%"
    // rowCount,
    // customPageSize = 20,
}) {
    const defaultColumn = React.useMemo(
        () => ({
            // When using the useFlexLayout:
            minWidth: 150, // minWidth is only used as a limit for resizing
            width: 150, // width is used for both the flex-basis and flex-grow
            maxWidth: 200, // maxWidth is only used as a limit for resizing
        }),
        []
    )

    const newColumns = React.useMemo(
        () => [
            {
                // Build our expander column
                id: 'expander', // Make sure it has an ID
                // Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
                //     <span {...getToggleAllRowsExpandedProps()}>
                //         {isAllRowsExpanded ? <FaAngleDown /> : <FaAngleRight />}
                //     </span>
                // ),
                width: 50,
                minWidth: 50,
                maxWidth: 50,
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
                                    paddingLeft: `${row.depth * 2}rem`,
                                },
                            })}
                        >
                            {row.isExpanded ? <FaAngleDown /> : <FaAngleRight />}
                        </span>
                    ) : null,
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
                width: 100,
                minWidth: 100,
                maxWidth: 100,
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
                    <div style={{ paddingLeft: row.depth > 0 ? `${row.depth * 2}rem` : "" }}>
                        <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                    </div>
                ),
            },
            ...columns
        ],
        []
    )

    // Use the state and functions returned from useTable to build your UI

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
        //         pageIndex,
        //         pageSize,
        //         // selectedRowIds
        //     expanded
        // },
    } = useTable(
        {
            columns: newColumns,
            data,
            onSelect,
            initialState: {
                autoResetExpanded: true
            },
            defaultColumn
        },
        useFlexLayout,
        useExpanded, // Use the useExpanded plugin hook
        // usePagination,
        useRowSelect
    )

    useEffect(() => {
        //  Suggested by aman - 16-Nov-2021 - PO-174
        rows.forEach((d) => {
            if (d.subRows && d.subRows.length < 20) {
                toggleRowExpanded(d.id, true)
            }
        })
    }, [])

    // useEffect(() => {
    //     setPageSize(gridPageSizes[0])
    //     // setPageSize(gridPageSizes[0])
    // }, [setPageSize,])

    useEffect(() => {
        const flatData = treeToFlatArray(selectedFlatRows.map(d => d.original), childrenProperty);
        onSelect([...uniqBy(flatData, uniqueKey)]);
    }, [selectedFlatRows]);

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
            }} className="border">
                <MaUTable {...getTableProps()} size="small" className="tableWrap">
                    <TableHead style={{ overflowY: "auto", overflowX: "hidden" }}>
                        {headerGroups.map(headerGroup => (
                            <TableRow {...headerGroup.getHeaderGroupProps()} style={{ background: "#efefef" }}>
                                {headerGroup.headers.map(column => (
                                    <TableCell {...column.getHeaderProps()}>
                                        {column.render('Header')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody style={{
                        overflowY: "scroll",
                        overflowX: "hidden",
                        // height: "250px"
                    }}>
                        {
                            rows.map((row, index) => {
                                prepareRow(row)
                                return (
                                    <TableRow {...row.getRowProps()} style={rowStyle(row.original)} key={row.original._id ?? index}>
                                        {row.cells.map(cell => {
                                            return (
                                                <TableCell {...cell.getCellProps()}>
                                                    {cell.render('Cell')}
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                )
                            })
                        }
                    </TableBody>

                    <TableFooter style={{ overflowY: "auto", overflowX: "hidden" }}>
                        {footerGroups.map(group => (
                            <TableRow {...group.getFooterGroupProps()} style={{ background: "#efefef" }}>
                                {group.headers.map(column => (
                                    <TableCell {...column.getFooterProps()} className="font-weight-bold text-black">
                                        {column.render('Footer')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableFooter>

                </MaUTable>
            </div>

            {/* <TablePagination
                component="div"
                count={data.length}
                page={pageIndex}
                className="agPagination"
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

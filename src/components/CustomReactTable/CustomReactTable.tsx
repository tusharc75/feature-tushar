
import React, { useEffect } from 'react'
import MaUTable from '@material-ui/core/Table'
import { TableBody, TableCell, TableHead, TableFooter, TableRow } from '@material-ui/core'
import Checkbox from '@material-ui/core/Checkbox';
import { FaAngleRight, FaAngleDown } from 'react-icons/fa';
import { TablePagination } from '@material-ui/core'
import { gridPageSizes, treeToFlatArray } from '../../constants/helpers'
import { uniqBy } from 'lodash';
import { useTable, useExpanded, useRowSelect, usePagination, useFlexLayout } from 'react-table'
import { useSticky } from "react-table-sticky";

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
    isInValidCheck = null,
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
            minWidth: 150, // minWidth is only used as a limit for resizing
            width: 150, // width is used for both the flex-basis and flex-grow
            // maxWidth: 250, // maxWidth is only used as a limit for resizing
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
                sticky: "left",
                width: 70,
                minWidth: 70,
                maxWidth: 70,
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
                    row?.original?.hideSelection ? null :
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
                autoResetExpanded: true,
                hiddenColumns: hideSelection ? ["selection", "action"] : []
            },
            defaultColumn
        },
        useFlexLayout,
        useExpanded, // Use the useExpanded plugin hook
        // usePagination,
        useRowSelect,
        useSticky
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
            }} className="border custom-react-table">
                <MaUTable {...getTableProps()} size="small" className="tableWrap table sticky">
                    <TableHead style={{ overflowY: "auto", overflowX: "hidden" }} className="header">
                        {headerGroups.map(headerGroup => (
                            <TableRow {...headerGroup.getHeaderGroupProps()} className="tr">
                                {headerGroup.headers.map(column => (
                                    <TableCell {...column.getHeaderProps()} className="th text-truncate">
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
                    }} className="body">
                        {
                            rows.map((row, index) => {
                                prepareRow(row)
                                return (
                                    <TableRow {...row.getRowProps()} key={row.original._id ?? index} className="tr">
                                        {row.cells.map(cell => {
                                            return (
                                                <TableCell {...cell.getCellProps()} className={`td ${isInValidCheck ? (isInValidCheck(row.original) ? "error" : "") : ""}`}>
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

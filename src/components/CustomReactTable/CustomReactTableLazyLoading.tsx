import React from 'react';
import { useExpanded, useTable } from 'react-table';
import { TableBody, TableCell, TableHead, TableFooter, TableRow } from '@material-ui/core'
import MaUTable from '@material-ui/core/Table'
import { productInventory } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';

function SubRows({ row, rowProps, visibleColumns, data, loading }) {
    if (loading) {
        return (
            <tr>
                <td />
                <td colSpan={visibleColumns.length - 1}>
                    Loading...
                </td>
            </tr>
        );
    }

    return (
        <>
            {data.map((x, i) => {
                return (
                    <tr
                        {...rowProps}
                        key={`${rowProps.key}-expanded-${i}`}
                    >
                        {row.cells.map((cell) => {
                            return (
                                <td
                                    {...cell.getCellProps()}
                                >
                                    {cell.render(cell.column.SubCell ? 'SubCell' : 'Cell', {
                                        value:
                                            cell.column.accessor &&
                                            cell.column.accessor(x, i),
                                        row: { ...row, original: x }
                                    })}
                                </td>
                            );
                        })}
                    </tr>
                );
            })}
        </>
    );
}

function SubRowAsync({ row, rowProps, visibleColumns }) {
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState([]);

    React.useEffect(() => {
        axiosInstance().get(`${productInventory.api}?filterById=[{"field": "pONumber", "term": "${row?.original?.poId}","field": "product", "term": "${row?.original?.productId}"}]`)
            .then(({ data }) => {
                data.data = data.data.map((u) => {
                    return ({
                        ...u,
                        description: u.assetNumber,
                        treeId: u._id,
                        actualDelivery: u.createdBy?.date,
                        expectedDelivery: row?.original?.expectedDelivery
                    })
                }

                );
                setData(data.data)
                setLoading(false)
            })
    }, []);

    return (
        <SubRows
            row={row}
            rowProps={rowProps}
            visibleColumns={visibleColumns}
            data={data}
            loading={loading}
        />
    );
}

function Table({ columns: userColumns, data, renderRowSubComponent }) {
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
        visibleColumns,
        footerGroups,
        state: { expanded }
    } = useTable(
        {
            columns: userColumns,
            data
        },
        useExpanded
    );

    return (
        <>
            <div style={{
                display: "block",
                overflow: "auto",
                height: "100%"
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
                                const rowProps = row.getRowProps();
                                return (
                                    // Use a React.Fragment here so the table markup is still valid
                                    <React.Fragment key={rowProps.key}>
                                        <TableRow {...rowProps}>
                                            {row.cells.map(cell => {
                                                return (
                                                    <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                                );
                                            })}
                                        </TableRow>
                                        {/* We could pass anything into this */}
                                        {row.isExpanded &&
                                            renderRowSubComponent({ row, rowProps, visibleColumns })}
                                    </React.Fragment>
                                );
                            })
                        }
                    </TableBody>

                    {
                        rows?.length > 0 &&
                        <TableFooter style={{ overflowY: "auto", overflowX: "hidden" }} className="footer">
                            {footerGroups.map(group => (
                                <TableRow {...group.getFooterGroupProps()}>
                                    {group.headers.map(column => (
                                        <TableCell {...column.getFooterProps()} className="font-weight-bold text-black">
                                            {column.render('Footer')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableFooter>
                    }

                </MaUTable>
            </div>
        </>
    );
}

function CustomReactTableLazyLoading({
    columns,
    data,
    onSelect,
    isInValidCheck = null,
    childrenProperty,
    uniqueKey,
    height = "100%"
}) {
    const mainColumns = React.useMemo(
        () => [
            {
                Header: () => null,
                id: 'expander',
                Cell: ({ row }) => (
                    <span {...row.getToggleRowExpandedProps()}>
                        {row.isExpanded ? '👇' : '👉'}
                    </span>
                ),
                SubCell: () => null
            },
            ...columns
        ],
        []
    );

    const tableData = React.useMemo(() => data, []);

    const renderRowSubComponent = React.useCallback(
        ({ row, rowProps, visibleColumns }) => (
            <SubRowAsync
                row={row}
                rowProps={rowProps}
                visibleColumns={visibleColumns}
            />
        ),
        []
    );

    return (
        <div style={{
            display: "block",
            overflow: "auto",
            height: height ?? "100%"
        }} className="border custom-react-table">
            <Table
                columns={mainColumns}
                data={data}
                renderRowSubComponent={renderRowSubComponent}
            />
        </div>
    );
}

export default CustomReactTableLazyLoading;

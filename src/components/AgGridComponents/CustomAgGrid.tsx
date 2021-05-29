import React, { useState } from 'react'
import { TablePagination } from '@material-ui/core';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';
import { isMobile, isTablet } from 'react-device-detect';
import { AgGridHeaderHeight, AgGridFloatingFiltersHeight, AgGridRowHeight } from '../../constants/helpers';
import CustomGridHeaderOptions from './CustomGridHeaderOptions';

export default function CustomAgGrid({ columns, dataRows, frameworkComponents, dispatch, rowCount, limit, pageSizes, page,
    setGridApi, allowSelection = true, allowAction = true, actionWidth = 200 }) {

    const [, setColumns] = useState(columns);
    const [columnApi, setColumnApi] = useState(null);

    //  If you want to do something once grid binding done
    const onGridReady = (params) => {
        setGridApi(params.api);
        setColumnApi(params.columnApi)

        // if (autoSizeColumns) {
        //     params.columnApi.autoSizeColumns(columns.map(m => m.field), false);
        // }
    }

    const generateColumns = columns.map((column: any, index) => {
        return <AgGridColumn
            key={index}
            field={column.field}
            headerName={column.headerName}
            filter={column.filter ?? "agTextColumnFilter"}
            sortable={column.sortable ?? true}
            cellRenderer={column.cellRenderer ?? null}
            minWidth={column.width ?? 250}
            flex={1}
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
        >
        </AgGridColumn>
    })

    return (
        <>
            <CustomGridHeaderOptions columns={columns} setColumns={setColumns} columnApi={columnApi} />

            <div className="ag-theme-material ag-grid-listing-grid">
                <AgGridReact
                    rowData={dataRows}
                    onGridReady={onGridReady}
                    suppressDragLeaveHidesColumns={true}
                    accentedSort={true}
                    suppressCellSelection={true}
                    headerHeight={AgGridHeaderHeight}
                    floatingFiltersHeight={AgGridFloatingFiltersHeight}
                    rowHeight={AgGridRowHeight}
                    frameworkComponents={frameworkComponents}
                    defaultColDef={{
                        resizable: true,
                        floatingFilter: true,
                        sortable: true,
                        suppressMenu: true,
                        // headerCheckboxSelection: true,
                        // checkboxSelection: true,
                        floatingFilterComponentParams: { suppressFilterButton: true }
                    }}
                    onSortChanged={() => {
                        dispatch({ type: "sort", sorting: columnApi.getColumnState().filter(d => ["asc", "desc"].some(s => s === d.sort)) });
                    }}
                    onFilterChanged={(e) => {
                        dispatch({ type: "filter", filters: e.api.getFilterModel() });
                    }}
                    enableCellTextSelection={true}
                    ensureDomOrder={false}
                    loadingOverlayComponent={'customLoadingOverlay'}
                    loadingOverlayComponentParams={{
                        loadingMessage: 'Loading...',
                    }}
                    animateRows={false}
                    suppressAnimationFrame={true}
                    suppressMaintainUnsortedOrder={true}

                    rowBuffer={limit}
                    // suppressMaxRenderedRowRestriction={true}

                    // loadingCellRenderer={'customLoadingCellRenderer'}
                    // loadingCellRendererParams={{
                    //   loadingMessage: 'One moment please...',
                    // }}

                    suppressRowClickSelection={true}
                    rowSelection={'multiple'}
                    onSelectionChanged={(event: any) => {
                        dispatch({ type: "selection", selectedRecords: event.api.getSelectedRows() })
                    }}
                    immutableData={true}
                    getRowNodeId={(data) => {
                        return data._id;
                    }}
                >
                    {
                        allowSelection && <AgGridColumn width={70} filter={false} pinned="left" lockPinned={true}
                            headerCheckboxSelection={true}
                            headerCheckboxSelectionFilteredOnly={true}
                            checkboxSelection={true}
                            resizable={false} sortable={false}
                        >
                        </AgGridColumn>
                    }

                    {generateColumns}

                    {
                        allowAction && <AgGridColumn width={actionWidth} headerName="Actions"
                            pinned={(isMobile || isTablet) ? false : "right"}
                            lockPinned={(isMobile || isTablet) ? false : true}
                            resizable={false} sortable={false}
                            filter={false} cellRenderer="actionsRenderer">
                        </AgGridColumn>
                    }

                </AgGridReact>
            </div>

            <TablePagination
                component="div"
                count={rowCount}
                page={page}
                onChangePage={(event, newPage) => {
                    dispatch({ type: "pageChange", page: newPage })
                }}
                rowsPerPage={limit}
                onChangeRowsPerPage={(event) => {
                    dispatch({ type: "pageSizeChange", limit: event.target.value })
                }}
                rowsPerPageOptions={pageSizes}
            />
        </>
    )
}

import React, { useState, useEffect } from 'react'
import { TablePagination } from '@material-ui/core';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';
import { isMobile, isTablet } from 'react-device-detect';
import { AgGridHeaderHeight, AgGridFloatingFiltersHeight, AgGridRowHeight, gridPageSizes } from '../../constants/helpers';
import CustomGridHeaderOptions from './CustomGridHeaderOptions';
import { CustomLoadingOverlay } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'

export function reducer(state, action) {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.loading
            }

        case "initialize":
            return {
                ...state,
                dataRows: action.data,
                rowCount: action.count,
                loading: false
            }

        case "selection":
            return {
                ...state,
                selectedRecords: action.selectedRecords,
            }

        case "update":
            return {
                ...state,
                dataRows: action.data,
                loading: false
            }

        case "filter":
            return {
                ...state,
                loading: true,
                filters: action.filters,
                page: 0
            }

        case "sort":
            return {
                ...state,
                sorting: action.sorting,
                loading: true
            }

        case "search":
            return {
                ...state,
                search: action.search,
                loading: true
            }

        case "pageChange":
            return {
                ...state,
                page: action.page
            }

        case "pageSizeChange":
            return {
                ...state,
                limit: action.limit,
                page: 0,
                loading: true
            }

        case "count":
            return {
                ...state,
                rowCount: action.count,
                loading: false
            }

        case "complete":
            return {
                ...state,
                loading: false
            }

        default:
            break;
    }

    return state;
}

export const intialState = {
    dataRows: [],
    rowCount: 0,
    loading: false,
    page: 0,
    limit: gridPageSizes[0],
    pageSizes: gridPageSizes,
    search: "",
    filters: {},
    sorting: [],
    selectedRecords: []
}

export default function CustomAgGrid({ columns, dataRows, frameworkComponents, dispatch, rowCount, limit, pageSizes, page,
    setGridApi, allowSelection = true, allowAction = true, actionWidth = 200,
    isClientSideGrid = false, handleGridReady = null }) {

    const [, setColumns] = useState(columns);
    const [columnApi, setColumnApi] = useState(null);

    const [clientSideGridApi, setClientSideGridApi] = useState(null);

    //  If you want to do something once grid binding done
    const onGridReady = (params) => {
        setGridApi(params.api);
        setColumnApi(params.columnApi);
        setClientSideGridApi(params.api);
        if (handleGridReady) handleGridReady(params)
    }

    var customFilterParams = {
        filterOptions: ['contains'],
        textCustomComparator: () => {
            return true;
        },
        // trimInput: true,
        // debounceMs: 1000,
    };

    const generateColumns = columns.map((column: any, index) => {
        return isClientSideGrid ?
            <AgGridColumn
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
            ></AgGridColumn>
            : <AgGridColumn
                key={index}
                field={column.field}
                headerName={column.headerName}
                filter={column.filter ?? "agTextColumnFilter"}
                sortable={column.sortable ?? true}
                cellRenderer={column.cellRenderer ?? null}
                minWidth={column.width ?? 250}
                flex={1}
                filterParams={customFilterParams}
                comparator={() => { return 0; }}
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

            <div className="ag-theme-material ag-grid-listing-grid" style={{zIndex:-500,position:'inherit'}}>
                <AgGridReact
                    rowData={dataRows}
                    onGridReady={onGridReady}
                    suppressDragLeaveHidesColumns={true}
                    accentedSort={true}
                    suppressCellSelection={true}
                    headerHeight={AgGridHeaderHeight}
                    floatingFiltersHeight={AgGridFloatingFiltersHeight}
                    rowHeight={AgGridRowHeight}
                    frameworkComponents={{
                        ...frameworkComponents,
                        customLoadingOverlay: CustomLoadingOverlay,
                        customFloatingFilter: CustomFloatingFilter,
                        // customLoadingCellRenderer: CustomLoadingCellRenderer,
                        // customNoRowsOverlay: CustomNoRowsOverlay
                    }}
                    enableCellChangeFlash={false}
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
                        if (!isClientSideGrid) {
                            dispatch({ type: "sort", sorting: columnApi.getColumnState().filter(d => ["asc", "desc"].some(s => s === d.sort)) });
                        }
                    }}
                    onFilterChanged={(e) => {
                        if (isClientSideGrid) {
                            clientSideGridApi.paginationGoToPage(0);
                            dispatch({ type: "count", count: clientSideGridApi.getModel().rootNode.allChildrenCount });
                            dispatch({ type: "pageChange", page: 0 });
                        } else {
                            dispatch({ type: "filter", filters: e.api.getFilterModel() });
                        }
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
                        return data._id ?? data.id;
                    }}

                    pagination={true}
                    suppressPaginationPanel={true}
                    paginationPageSize={limit}
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
                        allowAction && <AgGridColumn width={actionWidth} field="actions" headerName="Actions"
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
                    dispatch({ type: "pageChange", page: newPage });

                    if (clientSideGridApi) {
                        clientSideGridApi.paginationGoToPage(newPage);
                    }
                }}
                rowsPerPage={limit}
                onChangeRowsPerPage={(event) => {
                    dispatch({ type: "pageSizeChange", limit: event.target.value });

                    if (clientSideGridApi) {
                        clientSideGridApi.paginationGoToPage(0);
                        clientSideGridApi.paginationSetPageSize(event.target.value);
                    }
                }}
                rowsPerPageOptions={pageSizes}
            />
        </>
    )
}

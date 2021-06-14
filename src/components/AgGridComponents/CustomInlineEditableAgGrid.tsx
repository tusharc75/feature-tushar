import React, { useState, useEffect } from 'react'
import { TablePagination } from '@material-ui/core';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';
import { isMobile, isTablet } from 'react-device-detect';
import { AgGridHeaderHeight, AgGridFloatingFiltersHeight, AgGridRowHeight, gridPageSizes } from '../../constants/helpers';
import CustomGridHeaderOptions from './CustomGridHeaderOptions';
import { CustomLoadingOverlay } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import NumericEditor from './NumericEditor';

export default function CustomInlineEditableAgGrid() {
    const [columns, setColumns] = useState([
        { field: "product", editable: false, headerName: "Product", show: true },
        { field: "unit", editable: true, headerName: "Unit", show: true, type: "number" },
        { field: "price", editable: true, headerName: "Price", show: true, type: "number" },
        { field: "total", editable: false, headerName: "Total", show: true, type: "number" },
    ]);

    const [gridApi, setGridApi] = useState(null);

    //  If you want to do something once grid binding done
    const onGridReady = (params) => {
        setGridApi(params.api);
    }

    const generateColumns = columns.map((column: any, index) => {
        return <AgGridColumn
            key={index}
            field={column.field}
            headerName={column.headerName}
            filter={column.filter ?? "agTextColumnFilter"}
            sortable={column.sortable ?? true}
            minWidth={column.width ?? 250}
            flex={1}
            editable={column.editable ?? false}
            singleClickEdit={true}
            cellEditor={column.type === "number" ? "numericCellEditor" : null}
        ></AgGridColumn>
    })

    const dataRows = [
        {
            id: 1,
            product: "Product 1",
            unit: 1,
            price: 100,
            total: 100
        },
        {
            id: 2,
            product: "Product 2",
            unit: 2,
            price: 100,
            total: 200
        },
        {
            id: 3,
            product: "Product 3",
            unit: 3,
            price: 100,
            total: 300
        },
        {
            id: 4,
            product: "Product 4",
            unit: 4,
            price: 100,
            total: 400
        },
        {
            id: 5,
            product: "Product 5",
            unit: 5,
            price: 100,
            total: 500
        }
    ]

    return (
        <>
            <div className="ag-theme-material ag-grid-listing-grid">
                <AgGridReact
                    stopEditingWhenCellsLoseFocus={true}
                    rowData={dataRows}
                    onGridReady={onGridReady}
                    suppressDragLeaveHidesColumns={true}
                    accentedSort={true}
                    suppressCellSelection={true}
                    headerHeight={AgGridHeaderHeight}
                    floatingFiltersHeight={AgGridFloatingFiltersHeight}
                    rowHeight={AgGridRowHeight}
                    onCellValueChanged={(row) => {
                        const rowNode = gridApi.getRowNode(row.data.id);
                        const total = Number(row.data.unit) * Number(row.data.price);
                        rowNode.setDataValue('total', total);
                    }}
                    enableCellChangeFlash={false}
                    frameworkComponents={{
                        numericCellEditor: NumericEditor
                    }}
                    defaultColDef={{
                        resizable: true,
                        floatingFilter: true,
                        sortable: true,
                        suppressMenu: true,
                        floatingFilterComponentParams: { suppressFilterButton: true }
                    }}
                    enableCellTextSelection={true}
                    ensureDomOrder={false}
                    loadingOverlayComponent={'customLoadingOverlay'}
                    loadingOverlayComponentParams={{
                        loadingMessage: 'Loading...',
                    }
                    }
                    animateRows={false}
                    suppressAnimationFrame={true}
                    suppressMaintainUnsortedOrder={true}

                    suppressRowClickSelection={true}
                    rowSelection={'multiple'}
                   
                    immutableData={true}
                    getRowNodeId={(data) => {
                        return data._id ?? data.id;
                    }}

                    pagination={true}
                >
                    {/* {
                        <AgGridColumn width={70} filter={false} pinned="left" lockPinned={true}
                            headerCheckboxSelection={true}
                            headerCheckboxSelectionFilteredOnly={true}
                            checkboxSelection={true}
                            resizable={false} sortable={false}
                        >
                        </AgGridColumn>
                    } */}

                    {generateColumns}

                    {/* {
                        <AgGridColumn width={150} field="actions" headerName="Actions"
                            pinned={(isMobile || isTablet) ? false : "right"}
                            lockPinned={(isMobile || isTablet) ? false : true}
                            resizable={false} sortable={false}
                            filter={false} cellRenderer="actionsRenderer">
                        </AgGridColumn>
                    } */}

                </AgGridReact>
            </div>
        </>
    )
}



import React, { useState } from "react";
import { TablePagination } from "@material-ui/core";
import { AgGridReact, AgGridColumn } from "ag-grid-react";
import { isMobile, isTablet } from "react-device-detect";
import {
  AgGridHeaderHeight,
  AgGridFloatingFiltersHeight,
  AgGridRowHeight,
  gridPageSizes,
} from "../../constants/helpers";
import CustomGridHeaderOptions from "./CustomGridHeaderOptions";
import { CustomLoadingOverlay, CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomFloatingFilter from "../../components/AgGridComponents/CustomAgGridFilter";
import { orderBy } from "lodash";
import NumericEditor from "./NumericEditor";

export function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: action.loading,
      };

    case "initialize":
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
      };

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      };

    case "update":
      return {
        ...state,
        dataRows: action.data,
        loading: false,
      };

    case "filter":
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0,
      };

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loading: true,
      };

    case "search":
      return {
        ...state,
        search: action.search,
        loading: true,
      };

    case "pageChange":
      return {
        ...state,
        page: action.page,
      };

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true,
      };

    case "count":
      return {
        ...state,
        rowCount: action.count,
        loading: false,
      };

    case "complete":
      return {
        ...state,
        loading: false,
      };

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
  selectedRecords: [],
};

export default function CustomAgGridEditable({
  columns,
  dataRows,
  frameworkComponents,
  dispatch,
  rowCount,
  limit,
  pageSizes,
  page,
  loading,
  setGridApi,
  onRowDragEnd = null,
  refreshGrid = null,
  allowSelection = true,
  allowAction = true,
  actionWidth = 200,
  isClientSideGrid = false,
  handleGridReady = null,
  allowPagination = true,
  onCellValueChanged,
  className = "ag-grid-listing-grid",
  forProductBuilder = false,
  fromProductGrid = false,
  currency = null,
  renderedFrom = null
}) {
  const [, setColumns] = useState(columns);
  const [columnApi, setColumnApi] = useState(null);

  const [clientSideGridApi, setClientSideGridApi] = useState(null);
  const enableRowDrag = columns.some((d) => d.rowDrag);

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
    setClientSideGridApi(params.api);
    if (handleGridReady) handleGridReady(params);

    const columnState = JSON.parse(localStorage.getItem(renderedFrom));

    if (columnState) {
      params.columnApi.setColumnState(columnState);
    }
  };

  const onColumnMoved = (params) => {
    const columnState = JSON.stringify(params.columnApi.getColumnState());
    localStorage.setItem(renderedFrom, columnState);
  };

  let customFilterParams = {
    filterOptions: ["contains"],
    textCustomComparator: () => {
      return true;
    },
    // trimInput: true,
    // debounceMs: 1000,
  }

  const createdPinnedData = () => {
    const rowKeys = []
    dataRows.forEach((data) => {
      let obj = {}
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === "number" && k.includes(currency && currency.toLowerCase())) {
          obj[k] = v
        }
      })
      rowKeys.push(obj)
    })

    let res = rowKeys.reduce((result, item) => {
      const keys = Object.keys(item);
      keys.forEach(key => {
        if (key === 'srno') { return; }
        result[key] = result[key]
          ? result[key] + item[key]
          : item[key];
      });
      return result;
    }, { [fromProductGrid && !allowSelection && "productName"]: "Total" });

    let dataObj = {}
    Object.keys(res).forEach(k => {
      if (k !== "productName") {
        dataObj[k] = res[k] && res[k].toString().split(".")[1] !== undefined && res[k].toString().split(".")[1].length > 4
          ? parseFloat(res[k]).toFixed(4)
          : res[k]
      }
    })

    return [dataObj]
  }

  const generateColumns = columns.map((column: any, index) => {
    return isClientSideGrid ? (
      <AgGridColumn
        key={index}
        field={column.field}
        headerName={column.headerName}
        filter={column.filter ?? "agTextColumnFilter"}
        sortable={column.sortable ?? true}
        cellRenderer={column.cellRenderer ?? null}
        minWidth={column.width ?? 250}
        flex={1}
        rowDrag={column.rowDrag ?? false}
        editable={column.editable ?? false}
        cellEditor={column.cellEditor}
        singleClickEdit={true}
      // floatingFilterComponent={column.floatingFilterComponent ?? null}
      // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
      //   suppressFilterButton: true,
      // }}
      ></AgGridColumn>
    ) : (
      <AgGridColumn
        key={index}
        field={column.field}
        headerName={column.headerName}
        filter={column.filter ?? "agTextColumnFilter"}
        sortable={column.sortable ?? true}
        cellRenderer={column.cellRenderer ?? null}
        minWidth={column.width ?? 250}
        flex={1}
        filterParams={customFilterParams}
        comparator={() => {
          return 0;
        }}
        editable={column.editable ?? false}
        cellEditor={column.cellEditor}
        singleClickEdit={true}
      // floatingFilterComponent={column.floatingFilterComponent ?? null}
      // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
      //   suppressFilterButton: true,
      // }}
      ></AgGridColumn>
    );
  });

  return (
    <>
      <div className="ag-grid-main">
        {loading ? (
          <div className="loader">
            <span>Loading</span>
          </div>
        ) : (
          ""
        )}

        <div style={{ opacity: loading ? 0.5 : 1 }}>
          <CustomGridHeaderOptions
            columns={columns}
            setColumns={setColumns}
            columnApi={columnApi}
            refreshGrid={refreshGrid}
            renderedFrom={renderedFrom}
          />

          <div
            className={`ag-theme-material ${className}`}
            style={{ zIndex: -500, position: "inherit" }}
          >
            <AgGridReact
              rowData={dataRows}
              onColumnMoved={onColumnMoved}
              rowClassRules={{
                "red-data-row":
                  forProductBuilder &&
                  function (params) {
                    const tsp = params.data[`totalSalesPrice_${currency}`] || 0;
                    const qty = params.data.qty;

                    return qty === 0 || tsp === 0;
                  },
              }}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              accentedSort={true}
              suppressCellSelection={true}
              headerHeight={AgGridHeaderHeight}
              floatingFiltersHeight={AgGridFloatingFiltersHeight}
              rowHeight={AgGridRowHeight}
              frameworkComponents={{
                ...frameworkComponents,
                commonRenderer: frameworkComponents["commonRenderer"] ?? CommonRenderer,
                customLoadingOverlay: CustomLoadingOverlay,
                customFloatingFilter: CustomFloatingFilter,
                numericCellEditor: NumericEditor,
                // customLoadingCellRenderer: CustomLoadingCellRenderer,
                // customNoRowsOverlay: CustomNoRowsOverlay
              }}
              isRowSelectable={(rowNode) => {
                if (allowSelection) {
                  return rowNode.data && rowNode.data.hideSelection === true ? false : true;
                }
                return false;
              }}
              pinnedBottomRowData={fromProductGrid || forProductBuilder ? createdPinnedData() : []}
              enableCellChangeFlash={false}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                suppressMenu: true,
                // headerCheckboxSelection: true,
                // checkboxSelection: true,
                floatingFilterComponentParams: { suppressFilterButton: true },
              }}
              onSortChanged={() => {
                if (!isClientSideGrid) {
                  dispatch({
                    type: "sort",
                    sorting: columnApi
                      .getColumnState()
                      .filter((d) => ["asc", "desc"].some((s) => s === d.sort)),
                  });
                }
              }}
              onCellValueChanged={(row) => {
                onCellValueChanged(row);
              }}
              onFilterChanged={(e) => {
                if (isClientSideGrid) {
                  clientSideGridApi.paginationGoToPage(0);
                  dispatch({
                    type: "count",
                    count:
                      clientSideGridApi.getModel().rootNode.allChildrenCount,
                  });
                  dispatch({ type: "pageChange", page: 0 });
                } else {
                  dispatch({ type: "filter", filters: e.api.getFilterModel() });
                }
              }}
              enableCellTextSelection={true}
              ensureDomOrder={false}
              loadingOverlayComponent={"customLoadingOverlay"}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading...",
              }}
              animateRows={enableRowDrag ?? false}
              suppressAnimationFrame={!enableRowDrag}
              suppressMaintainUnsortedOrder={true}
              rowBuffer={limit}
              // suppressMaxRenderedRowRestriction={true}

              // loadingCellRenderer={'customLoadingCellRenderer'}
              // loadingCellRendererParams={{
              //   loadingMessage: 'One moment please...',
              // }}

              suppressRowClickSelection={true}
              rowSelection={"multiple"}
              onSelectionChanged={(event: any) => {
                dispatch({
                  type: "selection",
                  selectedRecords: event.api.getSelectedRows(),
                });
              }}
              onRowDragEnd={(event: any) => {
                if (onRowDragEnd) {
                  onRowDragEnd(orderBy(
                    event.api.getSelectedNodes(),
                    "rowIndex",
                    ["asc"]
                  ).map((d) => d.data));
                }
              }}
              immutableData={true}
              getRowNodeId={(data) => {
                return data._id ?? data.id;
              }}
              pagination={allowPagination}
              suppressPaginationPanel={true}
              paginationPageSize={limit}
              rowDragManaged={enableRowDrag}
            >
              {allowSelection && (
                <AgGridColumn
                  width={70}
                  filter={false}
                  pinned="left"
                  lockPinned={true}
                  headerCheckboxSelection={true}
                  headerCheckboxSelectionFilteredOnly={true}
                  checkboxSelection={true}
                  resizable={false}
                  sortable={false}
                  pinnedRowCellRendererFramework={() => (
                    <p>Total</p>
                  )}
                ></AgGridColumn>
              )}

              {generateColumns}

              {allowAction && (
                <AgGridColumn
                  width={actionWidth}
                  field="actions"
                  headerName="Actions"
                  pinned={isMobile || isTablet ? false : "right"}
                  lockPinned={isMobile || isTablet ? false : true}
                  resizable={false}
                  sortable={false}
                  filter={false}
                  cellRenderer="actionsRenderer"
                  // pinnedRowCellRenderer="commonRenderer"
                  pinnedRowCellRendererFramework={() => (
                    <></>
                  )}
                ></AgGridColumn>
              )}
            </AgGridReact>
          </div>

          {allowPagination && (
            <TablePagination
              component="div"
              count={rowCount}
              page={page}
              className="agPagination"
              onPageChange={(event, newPage) => {
                dispatch({ type: "pageChange", page: newPage });

                if (clientSideGridApi) {
                  clientSideGridApi.paginationGoToPage(newPage);
                }
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(event) => {
                dispatch({ type: "pageSizeChange", limit: event.target.value });

                if (clientSideGridApi) {
                  clientSideGridApi.paginationGoToPage(0);
                  clientSideGridApi.paginationSetPageSize(event.target.value);
                }
              }}
              rowsPerPageOptions={pageSizes}
            />
          )}
        </div>
      </div >
    </>
  );
}

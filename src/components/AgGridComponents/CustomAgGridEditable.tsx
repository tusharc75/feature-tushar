import React, { useEffect, useState } from "react";
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
import { orderBy, uniqBy } from "lodash";
import { checkStaticField, staticColumns } from "../../constants/columns"
import NumericEditor from "./NumericEditor";
import DateEditor from "./DateEditor";

export function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading,
        appendRows: action.loading === false ? false : state.appendRows
      };

    case 'initialize':
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
        selectedRecords: []
      };

    case 'selection':
      return {
        ...state,
        selectedRecords: action.selectedRecords
      };

    case 'update':
      return {
        ...state,
        dataRows: action.data,
        loading: false
      };

    case 'filter':
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      };

    case 'sort':
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      };

    case 'search':
      return {
        ...state,
        page: 0,
        search: action.search,
        loading: true
      };

    case 'pageChange':
      return {
        ...state,
        page: action.page,
        appendRows: isMobile,
      };

    case 'pageSizeChange':
      return {
        ...state,
        limit: action.limit,
        page: 0,
        appendRows: isMobile,
        loading: false
      };

    case 'count':
      return {
        ...state,
        rowCount: action.count,
        loading: false
      };

    case 'complete':
      return {
        ...state,
        loading: false
      };

    case 'showFilteredRecordsOnly':
      return {
        ...state,
        showFilteredRecordsOnly: !state.showFilteredRecordsOnly,
        page: 0
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
  selectedRecords: [],
  showFilteredRecordsOnly: false
};

export default function CustomAgGridEditable({
  columns:cols,
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
  onSelection = null,
  renderedFrom = null,
  customGridOptions = null,
  selectedRecords = [],
  isFooter = false,
  footerIgnoreFields = [],
  saveColumnOptions = false,
  showOnlyShowFilteredRecordSwitch = false,
  priceTemplateField = [],
  fromPurchaseOrderGrid = false,
  idProperty = "_id",
  rowClassRules = null,
  actionLabel = null,
  actionEditable = false,
}) {
  const [columns, setColumns] = useState([]);
  const [columnApi, setColumnApi] = useState(null);

  const [currentGridApi, setCurrentGridApi] = useState(null);
  const enableRowDrag = cols.some((d) => d.rowDrag);

  useEffect(( ) => {
    setColumns(cols)
  },[cols])

  useEffect(() => {
    if (currentGridApi && selectedRecords.length) {
      currentGridApi.forEachNode(function (node) {
        node.setSelected(
          selectedRecords.some((o) => o._id === node.data._id)
        );
      });
    }
    if (!isClientSideGrid && currentGridApi) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : []
        if (oldSelectedRecords.length > 0) {
          currentGridApi.forEachNode(function (node) {
            node.setSelected(
              oldSelectedRecords.some((o) => o[idProperty] === node.data[idProperty])
            );
          });
        }
      } catch (ex) {
        console.error("Error in getting selected records from local storage")
      }
    }
  }, [currentGridApi, selectedRecords])

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
    setCurrentGridApi(params.api);
    if (handleGridReady) handleGridReady(params);
    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
    if (!isClientSideGrid) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : []
        if (oldSelectedRecords.length > 0) {
          params.api.forEachNode(function (node) {
            node.setSelected(
              oldSelectedRecords.some((o) => o[idProperty] === node.data[idProperty])
            );
          });
        }
      } catch (ex) {
        console.error("Error in getting selected records from local storage")
      }
    }
  };

  const onFirstDataRendered = (e) => {
    try {
      if (localStorage.getItem(renderedFrom)) {
        const columnState = JSON.parse(localStorage.getItem(renderedFrom));
        setTimeout(() => {
          columnApi.setColumnState(columnState);
        }, 500)
      }
    } catch (_) {
      console.error("Error in configuring columns on onFirstDataRendered method")
    }

    if (currentGridApi) {
      currentGridApi.sizeColumnsToFit()
    }
  }

  const onColumnMoved = (params) => {
    const columnState = JSON.stringify(params.columnApi.getColumnState());
    localStorage.setItem(renderedFrom, columnState);
  };

  const onColumnResized = (params) => {
    if (params?.source === "uiColumnDragged") {
      const columnState = JSON.stringify(params.columnApi.getColumnState());
      localStorage.setItem(renderedFrom, columnState);
    }
  }

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
        if ((fromPurchaseOrderGrid || isFooter) && !footerIgnoreFields.includes(k) && typeof v === "number") {
          obj[k] = v
        }
        else if (typeof v === "number" && k.includes(currency && currency.toLowerCase())) {
          obj[k] = v
        }
        else if (typeof v === "number" && priceTemplateField.length > 0 && priceTemplateField.includes(k)) {
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
        cellRendererParams={column.cellRendererParams ?? null}
        minWidth={column.width ?? 250}
        // width={getWidth(column.field, column.width) ?? 250}
        // flex={1}
        rowDrag={column.rowDrag ?? false}
        editable={column.editable ?? false}
        cellEditor={column.cellEditor}
        singleClickEdit={true}
        cellEditorParams={column.cellEditorParams ?? {}}
        floatingFilterComponent="customFloatingFilter"
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
        hide={staticColumns.indexOf(column.field) >= 0 ? column?.show === false ? true : checkStaticField(renderedFrom, column.field) :
          (column.hasOwnProperty("show") && !column?.show) ? true : false}
        valueGetter={column.valueGetter ?? null}
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
        // width={getWidth(column.field, column.width) ?? 250}
        // flex={1}
        filterParams={customFilterParams}
        comparator={() => {
          return 0;
        }}
        editable={column.editable ?? false}
        cellEditor={column.cellEditor}
        singleClickEdit={true}
        cellEditorParams={column.cellEditorParams ?? {}}
        floatingFilterComponent="customFloatingFilter"
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
        hide={staticColumns.indexOf(column.field) >= 0 ? column?.show === false ? true : checkStaticField(renderedFrom, column.field) :
          (column.hasOwnProperty("show") && !column?.show) ? true : false}
        valueGetter={column.valueGetter ?? null}
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
            isClientSideGrid={isClientSideGrid}

            saveColumnOptions={saveColumnOptions}
            dispatch={dispatch}
            showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
          />

          <div
            className={`ag-theme-material ${className}`}
            style={{ zIndex: -500, position: "inherit" }}
          >
            <AgGridReact
              onFirstDataRendered={onFirstDataRendered}
              gridOptions={customGridOptions}
              rowData={dataRows}
              onColumnMoved={onColumnMoved}
              rowClassRules={rowClassRules ? rowClassRules : {
                "red-data-row":
                  (forProductBuilder &&
                    function (params) {
                      const tsp = params.data[`totalSalesPrice_${currency}`] || 0;
                      const qty = params.data.qty;
                      return qty === 0 || tsp === 0;
                    }),
              }}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              accentedSort={true}
              suppressCellSelection={true}
              headerHeight={AgGridHeaderHeight}
              floatingFiltersHeight={AgGridFloatingFiltersHeight}
              rowHeight={AgGridRowHeight}
              onColumnResized={onColumnResized}
              frameworkComponents={{
                ...frameworkComponents,
                commonRenderer: frameworkComponents["commonRenderer"] ?? CommonRenderer,
                customLoadingOverlay: CustomLoadingOverlay,
                customFloatingFilter: CustomFloatingFilter,
                numericCellEditor: NumericEditor,
                dateEditor: DateEditor
                // customLoadingCellRenderer: CustomLoadingCellRenderer,
                // customNoRowsOverlay: CustomNoRowsOverlay
              }}
              isRowSelectable={(rowNode) => {
                if (allowSelection) {
                  return rowNode.data && rowNode.data.hideSelection === true ? false : true;
                }
                return false;
              }}
              pinnedBottomRowData={isFooter || fromProductGrid || forProductBuilder || fromPurchaseOrderGrid ? createdPinnedData() : []}
              enableCellChangeFlash={false}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                suppressMenu: true,
                suppressSizeToFit: true,
                suppressAutoSize: true,
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
                  currentGridApi.paginationGoToPage(0);
                  dispatch({
                    type: "count",
                    count:
                      currentGridApi.getModel().rootNode.allChildrenCount,
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
                if (onSelection) onSelection(event.api.getSelectedRows());
                dispatch({
                  type: 'selection',
                  selectedRecords: event.api.getSelectedRows()
                });
                if (renderedFrom) {
                  try {
                    let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : []
                    if (oldSelectedRecords.length > 0) {
                      const uniqueRecords = uniqBy([...oldSelectedRecords, ...event.api.getSelectedRows()], idProperty)
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(uniqueRecords));
                    } else {
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(event.api.getSelectedRows()))
                    }
                  } catch (ex) {
                    console.error("Error in getting / storing selected records")
                  }
                }
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
              onRowSelected={(event) => {
                if (event.rowIndex !== null && !isClientSideGrid) {

                  try {
                    let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : []

                    if (event.node.isSelected() === true && !oldSelectedRecords.some(s => s[idProperty] === event.node.data[idProperty])) {
                      oldSelectedRecords = [...oldSelectedRecords, event.node.data];
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(oldSelectedRecords));
                    }
                    else if (event.node.isSelected() === false) {

                      if (oldSelectedRecords.length > 0) {
                        localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(oldSelectedRecords.filter(f => f[idProperty] !== event.data[idProperty])));
                      }
                    }
                  } catch (ex) {
                    console.error("Error in getting / storing selected records")
                  }
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
            // stopEditingWhenCellsLoseFocus={true}
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
                  field={actionLabel ? actionLabel.toLowerCase() : "actions"}
                  headerName={actionLabel || "Actions"}
                  pinned={isMobile || isTablet ? false : "right"}
                  lockPinned={isMobile || isTablet ? false : true}
                  resizable={false}
                  sortable={false}
                  filter={false}
                  editable={actionEditable}
                  cellEditor={"numericCellEditor"}
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

                if (currentGridApi) {
                  currentGridApi.paginationGoToPage(newPage);
                }
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(event) => {
                dispatch({ type: "pageSizeChange", limit: event.target.value });

                if (currentGridApi) {
                  currentGridApi.paginationGoToPage(0);
                  currentGridApi.paginationSetPageSize(event.target.value);
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

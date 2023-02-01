import React, { useState, useEffect } from 'react';
// import { TablePagination } from '@material-ui/core';
import TablePagination from '@material-ui/core/TablePagination';
import { AgGridReact, AgGridColumn } from 'ag-grid-react';
import { isMobile, isTablet } from 'react-device-detect';
import { AgGridHeaderHeight, AgGridFloatingFiltersHeight, AgGridRowHeight, gridPageSizes, generateUniqueId } from '../../constants/helpers';
import CustomGridHeaderOptions from './CustomGridHeaderOptions';
import { CustomLoadingOverlay, CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter';
import { orderBy } from 'lodash';
import { checkStaticField, staticColumns } from '../../constants/columns';
import { GridApi } from 'ag-grid-community';
import { uniqBy } from 'lodash';
import { useData } from 'src/StateProvider/Provider';
import GridFilters from './GridFilters';

export function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading,
        appendRows: action.loading === false ? false : state.appendRows
      };
    case 'onlyLoading':
      return {
        ...state,
        loading: action.loading
      };
    case 'onlyFilter':
      return {
        ...state,
        filters: action.filters
      };

    case 'initialize':
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
        selectedRecords: action.selectedRecords ?? state.selectedRecords
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
        appendRows: isMobile
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
  search: '',
  filters: {},
  sorting: [],
  selectedRecords: [],
  appendRows: isMobile,
  showFilteredRecordsOnly: false
};

export default function CustomAgGrid({
  columns: cols,
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
  selectedRecords = [],
  onSelection = null,
  renderedFrom = null,
  customGridOptions = null,
  actionLabel = null,
  actionEditable = false,
  onCellValueChanged = () => {},
  showOnlyShowFilteredRecordSwitch = false,
  idProperty = '_id',
  allowHeaderSelection = true,
  pinnedBottomRowData = null,
  rowClassRules = null,
  selectedReportView = null,
  setSelectedReportView = null,
  isMultipleSelection = true,
  reportSave = false
}) {
  const [columns, setColumns] = useState([]);
  const [columnApi, setColumnApi] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleClickOpen = () => {
    setIsFilterOpen(true);
  };

  const {
    state: { searchQuery }
  }: any = useData();

  useEffect(() => {
    let timer;
    if (searchQuery) {
      timer = setTimeout(() => {
        let query = searchQuery?.trim();
        if (query !== '') {
          dispatch({ type: 'search', search: query });
        }
      }, 300);
    }
    // else {
    //   timer = setTimeout(() => {
    //     dispatch({ type: 'search', search: '' });
    //     dispatch({ type: 'loading', loading: false });
    //   }, 300);
    // }
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [currentGridApi, setCurrentGridApi] = useState<GridApi | any>(null);
  const enableRowDrag = cols.some((d) => d.rowDrag);

  useEffect(() => {
    if ((reportSave && selectedReportView) || renderedFrom?.includes('_report')) {
      const newColumnsState = reportSave && selectedReportView ? selectedReportView.columnState : localStorage.getItem(renderedFrom);
      const parseColumns = JSON.parse(newColumnsState);
      let newColumns = [];

      cols.forEach((col) => {
        let newColObject = { ...col };
        if (parseColumns) {
          parseColumns.forEach((column) => {
            if (newColObject.field === column.colId) {
              newColObject.show = !column.hide;
            }
          });
        }
        newColumns.push(newColObject);
      });

      setColumns(newColumns);
    } else {
      setColumns(cols);
    }
  }, [cols]);

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi);
    setCurrentGridApi(params.api);
    if (handleGridReady) handleGridReady(params);
    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));

    if (!isClientSideGrid) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : [];
        if (oldSelectedRecords.length > 0) {
          params.api.forEachNode(function (node) {
            node.setSelected(oldSelectedRecords.some((o) => o[idProperty] === node.data[idProperty]));
          });
        }
      } catch (ex) {
        console.error('Error in getting selected records from local storage');
      }
    }
  };

  const onFirstDataRendered = (e) => {
    try {
      if (localStorage.getItem(renderedFrom)) {
        const columnState = JSON.parse(localStorage.getItem(renderedFrom));

        setTimeout(() => {
          if (columnApi) columnApi.setColumnState(columnState);
        }, 500);
      }
    } catch (_) {
      console.error('Error in configuring columns on onFirstDataRendered method');
    }

    if (currentGridApi) {
      currentGridApi.sizeColumnsToFit();
    }
  };

  const onColumnMoved = (params) => {
    if (params?.source === 'uiColumnDragged') {
      const columnState = JSON.stringify(params.columnApi.getColumnState());
      localStorage.setItem(renderedFrom, columnState);
      // autosizeColumnsIfNeeded()
    }
  };

  const onColumnResized = (params) => {
    if (params?.source === 'uiColumnDragged') {
      const columnState = JSON.stringify(params.columnApi.getColumnState());
      localStorage.setItem(renderedFrom, columnState);
      // autosizeColumnsIfNeeded()
    }
  };

  useEffect(() => {
    if (currentGridApi && selectedRecords.length) {
      currentGridApi.forEachNode(function (node) {
        node.setSelected(selectedRecords.some((o) => o[idProperty] === node.data[idProperty]));
      });
    }

    if (!isClientSideGrid && currentGridApi) {
      try {
        let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`) ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`)) : [];
        if (oldSelectedRecords.length > 0) {
          currentGridApi.forEachNode(function (node) {
            node.setSelected(oldSelectedRecords.some((o) => o[idProperty] === node.data[idProperty]));
          });
        }
      } catch (ex) {
        console.error('Error in getting selected records from local storage');
      }
    }
  }, [currentGridApi, selectedRecords]);

  // useEffect(() => {
  //   if (columnApi && loading === false) {
  //     autosizeColumnsIfNeeded()
  //   }
  // }, [columnApi])

  var customFilterParams = {
    filterOptions: ['contains'],
    textCustomComparator: () => {
      return true;
    }
    // trimInput: true,
    // debounceMs: 1000,
  };

  // const autosizeColumnsIfNeeded = () => {
  //   if (columnApi) {

  //     let columns = columnApi.getAllDisplayedColumns();

  //     let availableWidth = document.getElementById("grid-listing").clientWidth

  //     let usedWidth = 0
  //     columns.forEach(o => {
  //       usedWidth = usedWidth + (o.actualWidth || o.minWidth)
  //     })
  //     if (usedWidth < availableWidth) {
  //       columnApi.sizeColumnsToFit();
  //     }
  //   }
  // }

  const getActionColumn = () => {
    if (allowAction) {
      return (
        <AgGridColumn
          key={generateUniqueId()}
          width={actionWidth}
          field="actions"
          headerName={actionLabel ? actionLabel : 'Actions'}
          pinned={'right'}
          lockPinned={true}
          resizable={true}
          sortable={false}
          editable={actionEditable}
          filter={false}
          onCellValueChanged={onCellValueChanged}
          cellRenderer="actionsRenderer"
          pinnedRowCellRendererFramework={pinnedBottomRowData ? () => <></> : null}
        ></AgGridColumn>
      );
    } else return null;
  };

  const generateColumns = [...columns, { isAction: true }].map((column: any, index) => {
    return isClientSideGrid ? (
      column.isAction ? (
        getActionColumn()
      ) : (
        <AgGridColumn
          key={index}
          field={column.field ?? null}
          cellStyle={column.cellStyle}
          headerName={column.headerName}
          filter={column.filter ?? 'agTextColumnFilter'}
          sortable={column.sortable ?? true}
          cellRenderer={column.cellRenderer ?? null}
          cellRendererParams={column.cellRendererParams ?? null}
          minWidth={column.width ?? 180}
          // width={getWidth(column.field, column.width) ?? 180}
          // flex={1}
          rowDrag={column.rowDrag ?? false}
          hide={
            staticColumns.indexOf(column.field) >= 0
              ? column?.show === false
                ? true
                : checkStaticField(renderedFrom, column.field)
              : column.hasOwnProperty('show') && !column?.show
              ? true
              : false
          }
          floatingFilterComponent="customFloatingFilter"
          valueGetter={column.valueGetter ?? null}
          // floatingFilterComponent={column.floatingFilterComponent ?? null}
          // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
          //   suppressFilterButton: true,
          // }}
        ></AgGridColumn>
      )
    ) : column.isAction ? (
      getActionColumn()
    ) : (
      <AgGridColumn
        lockPosition={column?.lockPosition ? true : false}
        key={index}
        field={column.field}
        cellStyle={column.cellStyle}
        headerName={column.headerName}
        filter={column.filter ?? 'agTextColumnFilter'}
        sortable={column.sortable ?? true}
        cellRenderer={column.cellRenderer ?? null}
        cellRendererParams={column.cellRendererParams ?? null}
        minWidth={column.width ?? 180}
        // width={getWidth(column.field, column.width) ?? 180}
        // flex={1}
        filterParams={customFilterParams}
        hide={
          staticColumns.indexOf(column.field) >= 0
            ? column?.show === false
              ? true
              : checkStaticField(renderedFrom, column.field)
            : column.hasOwnProperty('show') && !column?.show
            ? true
            : false
        }
        comparator={() => {
          return 0;
        }}
        floatingFilterComponent="customFloatingFilter"
        valueGetter={column.valueGetter ?? null}
        // floatingFilterComponent={column.floatingFilterComponent ?? null}
        // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
        //   suppressFilterButton: true,
        // }}
      ></AgGridColumn>
    );
  });

  return (
    <>
      <div className="ag-grid-main custom-react-table-v1">
        {loading ? (
          <div className="loader">
            <span>Loading</span>
          </div>
        ) : (
          ''
        )}

        <div style={{ opacity: loading ? 0.5 : 1 }}>
          <CustomGridHeaderOptions
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
            reportSave={reportSave}
            columns={columns}
            setColumns={setColumns}
            columnApi={columnApi}
            refreshGrid={refreshGrid}
            renderedFrom={renderedFrom}
            isClientSideGrid={isClientSideGrid}
            dispatch={dispatch}
            showOnlyShowFilteredRecordSwitch={showOnlyShowFilteredRecordSwitch}
            selectedRecords={selectedRecords}
            handleFilterOpen={handleClickOpen}
          />
          <GridFilters
            open={isFilterOpen}
            setOpen={setIsFilterOpen}
            currentGridApi={currentGridApi}
            columnApi={columnApi}
            columns={columns}
            tableSource={renderedFrom}
          />
          <div id="grid-listing" className="ag-theme-material ag-grid-listing-grid" style={{ zIndex: -500, position: 'inherit' }}>
            <AgGridReact
              onFirstDataRendered={onFirstDataRendered}
              gridOptions={customGridOptions}
              rowData={dataRows}
              onColumnMoved={onColumnMoved}
              rowClassRules={rowClassRules}
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
                commonRenderer: frameworkComponents['commonRenderer'] ?? CommonRenderer,
                customLoadingOverlay: CustomLoadingOverlay,
                customFloatingFilter: CustomFloatingFilter
                // customLoadingCellRenderer: CustomLoadingCellRenderer,
                // customNoRowsOverlay: CustomNoRowsOverlay
              }}
              isRowSelectable={(rowNode) => {
                if (allowSelection) {
                  return rowNode.data && rowNode.data.hideSelection === true ? false : true;
                }
                return false;
              }}
              enableCellChangeFlash={false}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                suppressMenu: true,
                // suppressSizeToFit: true,
                // suppressAutoSize: true,
                // headerCheckboxSelection: true,
                // checkboxSelection: true,
                floatingFilterComponentParams: { suppressFilterButton: true }
              }}
              onSortChanged={() => {
                if (!isClientSideGrid) {
                  dispatch({
                    type: 'sort',
                    sorting: columnApi.getColumnState().filter((d) => ['asc', 'desc'].some((s) => s === d.sort))
                  });
                }
              }}
              onFilterChanged={(e) => {
                if (isClientSideGrid) {
                  currentGridApi.paginationGoToPage(0);
                  dispatch({
                    type: 'count',
                    count: currentGridApi.getModel().rootNode.allChildrenCount
                  });
                  dispatch({ type: 'pageChange', page: 0 });
                } else {
                  dispatch({ type: 'filter', filters: e.api.getFilterModel() });
                }
              }}
              enableCellTextSelection={true}
              ensureDomOrder={false}
              suppressLoadingOverlay={true}
              // loadingOverlayComponent={'customLoadingOverlay'}
              // loadingOverlayComponentParams={{
              //     loadingMessage: 'Loading...',
              // }}
              animateRows={enableRowDrag ?? false}
              suppressAnimationFrame={!enableRowDrag}
              suppressMaintainUnsortedOrder={true}
              rowBuffer={limit}
              // suppressMaxRenderedRowRestriction={true}

              // loadingCellRenderer={'customLoadingCellRenderer'}
              // loadingCellRendererParams={{
              //   loadingMessage: 'One moment please...',
              // }}
              pinnedBottomRowData={pinnedBottomRowData ?? null}
              suppressRowClickSelection={true}
              rowSelection={!isMultipleSelection ? 'single' : 'multiple'}
              onRowSelected={(event) => {
                if (event.rowIndex !== null && !isClientSideGrid) {
                  try {
                    let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`)
                      ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`))
                      : [];

                    if (event.node.isSelected() === true && !oldSelectedRecords.some((s) => s[idProperty] === event.node.data[idProperty])) {
                      oldSelectedRecords = [...oldSelectedRecords, event.node.data];
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(oldSelectedRecords));
                    } else if (event.node.isSelected() === false) {
                      if (oldSelectedRecords.length > 0) {
                        localStorage.setItem(
                          `${renderedFrom}_selected`,
                          JSON.stringify(oldSelectedRecords.filter((f) => f[idProperty] !== event.data[idProperty]))
                        );
                      }
                    }
                  } catch (ex) {
                    console.error('Error in getting / storing selected records');
                  }
                }
              }}
              onSelectionChanged={(event: any) => {
                if (onSelection) onSelection(event.api.getSelectedRows());
                dispatch({
                  type: 'selection',
                  selectedRecords: event.api.getSelectedRows()
                });

                if (renderedFrom) {
                  try {
                    let oldSelectedRecords = localStorage.getItem(`${renderedFrom}_selected`)
                      ? JSON.parse(localStorage.getItem(`${renderedFrom}_selected`))
                      : [];
                    if (oldSelectedRecords.length > 0) {
                      const uniqueRecords = uniqBy([...oldSelectedRecords, ...event.api.getSelectedRows()], idProperty);
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(uniqueRecords));
                    } else {
                      localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(event.api.getSelectedRows()));
                    }
                  } catch (ex) {
                    console.error('Error in getting / storing selected records');
                  }
                }
              }}
              onRowDragEnd={(event: any) => {
                if (onRowDragEnd) {
                  onRowDragEnd(orderBy(event.api.getSelectedNodes(), 'rowIndex', ['asc']).map((d) => d.data));
                }
              }}
              immutableData={true}
              getRowNodeId={(data) => {
                return data[idProperty];
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
                  headerCheckboxSelection={allowHeaderSelection}
                  headerCheckboxSelectionFilteredOnly={true}
                  checkboxSelection={true}
                  resizable={false}
                  sortable={false}
                  pinnedRowCellRendererFramework={pinnedBottomRowData ? () => <></> : null}
                ></AgGridColumn>
              )}

              {columns.length > 0 ? generateColumns : null}
            </AgGridReact>
          </div>

          {allowPagination && (
            <TablePagination
              component="div"
              count={rowCount}
              page={page}
              className="agPagination pagination-v1"
              onPageChange={(event, newPage) => {
                dispatch({ type: 'pageChange', page: newPage });

                if (currentGridApi) {
                  currentGridApi.paginationGoToPage(newPage);
                }
              }}
              rowsPerPage={limit}
              onRowsPerPageChange={(event) => {
                dispatch({ type: 'pageSizeChange', limit: event.target.value });

                if (currentGridApi) {
                  currentGridApi.paginationGoToPage(0);
                  currentGridApi.paginationSetPageSize(event.target.value);
                }
              }}
              rowsPerPageOptions={pageSizes}
            />
          )}
        </div>
      </div>
    </>
  );
}

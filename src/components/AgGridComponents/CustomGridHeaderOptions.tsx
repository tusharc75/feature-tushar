import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, Divider, FormControlLabel, Tooltip, Switch, IconButton } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../constants/useColumns';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';

// import { BsArrowLeftRight } from 'react-icons/bs';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';

let timeout;
export default function CustomGridHeaderOptions({
  refreshGrid = null,
  renderedFrom = null,
  dispatch: gridDispatch = null,
  showOnlyShowFilteredRecordSwitch = false,
  selectedRecords = []
}) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(initialValue.length === 0);
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }
  }, [selectedRecords]);
  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [checked, setChecked] = useState(false);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const {
    state: { user }
  }: any = useData();
  const { dispatch }: any = useData();

  const updateGridHiddenColumns = (hiddenColumns = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let data = localStorage.getItem('gridMetaData');
      let request = data == 'undefined' ? {} : { ...JSON.parse(data) };
      if (request[renderedFrom]) {
        request[renderedFrom].hide = [...hiddenColumns];
      } else {
        request[renderedFrom] = {
          hide: [...hiddenColumns],
          staticColumns: {
            createdBy: false,
            updatedBy: false
          },
          disable: disabledColumns[renderedFrom] ?? []
        };
      }
      updateGridMetaData(request);
    }, 600);
  };
  const updateGridMetaData = (request) => {
    axiosInstance()
      .post(`user/meta-grid`, {
        _id: user?.user?._id,
        gridMetaData: { ...request }
      })
      .then((data) => {
        fetchGridMetaData();
      });
  };
  const fetchGridMetaData = () => {
    axiosInstance()
      .get(`user/meta-grid/${user?.user?._id}`)
      .then(({ data: { data } }) => {
        let tempMetaData = JSON.stringify(data?.gridMetaData);
        localStorage.setItem('gridMetaData', tempMetaData);
        if (dispatch) {
          dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
        }
      });
  };

  // useEffect(() => {
  //   if (!selectedReportView || !columnApi) return;
  //   localStorage.removeItem(renderedFrom);
  //   const columnView = JSON.parse(selectedReportView.columnState);
  //   columnApi.setColumnState(columnView)
  // }, [selectedReportView, columnApi]);

  return (
    <>
      <Box className="ag-grid-listing-grid-header-options d-flex gap-2 justify-content-space-between" style={{ flexWrap: 'wrap' }}>
        <div className="d-flex gap-2">
          {/* <Tooltip title="Arrange View" placement="top">
            <IconButton
              aria-describedby="columnSelection"
              size="small"
              className="px-2  arrange-view-v2"
              color="primary"
              onClick={(event) => {
                setOpenColumnSelection(true);
                setOpenColumnSelectionAnchorEl(event.currentTarget);
              }}
            >
              <SwapHorizIcon style={{ color: '#1d1d1d' }} />
            </IconButton>
          </Tooltip> */}

          {/* <Popover
            id="columnSelection"
            // open={openColumnSelection}
            open={false}
            anchorEl={openColumnSelectionAnchorEl}
            onClose={() => {
              setOpenColumnSelection(false);
              setOpenColumnSelectionAnchorEl(null);
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
          >
            <FormControl component="fieldset" className="px-3 py-2">
              <FormGroup>
                <FormControlLabel
                  key={"allcolumns"}
                  className="my-1"
                  name={"allcolumns"}
                  control={
                    <Switch
                      size="small"
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newColumns = [...columns];
                        newColumns?.forEach((e: any) => {
                          if (!e.disabled) {
                            e.show = event.target.checked;
                          }
                        })
                        setColumns(newColumns);
                        const hiddenColumns = newColumns.filter((d) => !d.show).map((m) => m.field);
                        const nonHiddenColumns = newColumns.filter((d) => d.show).map((m) => m.field);
                        columnApi.setColumnsVisible(hiddenColumns, false);
                        columnApi.setColumnsVisible(nonHiddenColumns, true);
                        if ((!isClientSideGrid) || saveColumnOptions) {
                          let tempColumnState = columnApi.getColumnState()
                          let hidedColumns = tempColumnState.filter(o => o?.hide)
                            .map(o => o?.colId)
                          updateGridHiddenColumns(hidedColumns)
                        }
                        const columnState = JSON.stringify(columnApi.getColumnState());
                        localStorage.setItem(renderedFrom, columnState);
                      }}
                    />
                  }
                  label={"All Columns"}
                />
                {getSortedColumns(columns).map((column: any, index) => {
                  return (
                    <Tooltip key={index} title={column.disabled ? 'Main columns are always visible' : ''}>
                      <FormControlLabel
                        key={index}
                        className="my-1"
                        name={column.field}
                        control={
                          <Switch
                            size="small"
                            disabled={column.disabled}
                            checked={column.show}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                              const newColumns = [...columns];

                              const getFieldIndex = columns.findIndex((d) => d.field === column.field);
                              newColumns[getFieldIndex].show = event.target.checked;
                              setColumns(newColumns);

                              const hiddenColumns = newColumns.filter((d) => !d.show).map((m) => m.field);
                              const nonHiddenColumns = newColumns.filter((d) => d.show).map((m) => m.field);
                              columnApi.setColumnsVisible(hiddenColumns, false);
                              columnApi.setColumnsVisible(nonHiddenColumns, true);
                              if ((!isClientSideGrid) || saveColumnOptions) {
                                let tempColumnState = columnApi.getColumnState()
                                let hidedColumns = tempColumnState.filter(o => o?.hide)
                                  .map(o => o?.colId)
                                updateGridHiddenColumns(hidedColumns)
                              }
                              const columnState = JSON.stringify(columnApi.getColumnState());
                              localStorage.setItem(renderedFrom, columnState);
                            }}
                          />
                        }
                        label={column.headerName}
                      />
                    </Tooltip>
                  );
                })}
              </FormGroup>
            </FormControl>
          </Popover> */}
          {/* {showOnlyShowFilteredRecordSwitch && (
            <>

              <FormControlLabel
                value={checked}
                checked={checked}
                onChange={() => {
                  setChecked(!checked);

                  if (gridDispatch) {
                    gridDispatch({
                      type: 'showFilteredRecordsOnly'
                      // showFilteredRecordsOnly: columnApi.getColumnState().filter((d) => ['asc', 'desc'].some((s) => s === d.sort))
                    });
                  }
                }}
                control={<Switch size="small" color="primary" disabled={disableSelectionSwitch} />}
                style={{ fontSize: '0.8rem', marginLeft: 0 }}
                label="Show Only Selected"
                labelPlacement="end"
              />
            </>
          )} */}
        </div>

        <div style={{ marginLeft: 'auto' }}>
          {/* {refreshGrid && (
            <>
            

              <Tooltip title="Refresh">
                <IconButton
                  // aria-describedby="columnSelection"
                  // size="small"
                  // className="px-2"
                  // startIcon={<RefreshIcon />}
                  // color="primary"
                  disabled={isOffline}
                  size="small"
                  onClick={() => {
                    refreshGrid();
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </>
          )} */}
        </div>

        {/* <Button aria-describedby="columnSelection"
            size="small"
            className="px-2"
            startIcon={<FilterListIcon />}
            color="primary"
            onClick={() => {
                setShowGridFilters(!showGridFilters)
            }}>
            {`${showGridFilters ? "Hide" : "Show"} filters`}
        </Button> */}
      </Box>

      {/* {openColumnSelection && (
        <>
          {renderedFrom?.includes('report') && reportSave ? (
            <ReportArrangeView
              columns={columns}
              onClose={() => setOpenColumnSelection(false)}
              updateGridHiddenColumns={updateGridHiddenColumns}
              saveColumnOptions={saveColumnOptions}
              setColumns={setColumns}
              columnApi={columnApi}
              isClientSideGrid={isClientSideGrid}
              renderedFrom={renderedFrom}
              selectedReportView={selectedReportView}
              setSelectedReportView={setSelectedReportView}
            />
          ) : (
            <ArrangeViewDialog
              columns={columns}
              onClose={() => setOpenColumnSelection(false)}
              updateGridHiddenColumns={updateGridHiddenColumns}
              saveColumnOptions={saveColumnOptions}
              setColumns={setColumns}
              columnApi={columnApi}
              isClientSideGrid={isClientSideGrid}
              renderedFrom={renderedFrom}
            />
          )}
        </>
      )} */}
    </>
  );
}

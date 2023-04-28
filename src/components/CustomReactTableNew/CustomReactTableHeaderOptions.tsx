import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, Divider, FormControlLabel, Tooltip, Switch, IconButton } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../constants/useColumns';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import ArrangeViewDialog from './ArrangeViewDialog';
import ReportArrangeView from './ReportArrangeView';

let timeout;
function CustomReactTableHeaderOptions({
  columns,
  // setColumns,
  // columnApi,
  // refreshGrid = null,
  renderedFrom = null,
  isClientSideGrid = false,
  // dispatch: gridDispatch = null,
  showOnlyShowFilteredRecordSwitch = false,
  saveColumnOptions = false,
  selectedRecords = 0,
  // selectedReportView = null,
  // setSelectedReportView = null
  setHiddenColumns = null,
  getToggleHideAllColumnsProps = null,
  setColumnOrder = null
}) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);

  useEffect(() => {
    if (selectedRecords === 0) {
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
  //     if (!selectedReportView || !columnApi) return

  //     localStorage.removeItem(renderedFrom)

  //     const columnView = JSON.parse(selectedReportView.columnState);

  //     columnApi.setColumnState(columnView);

  // }, [selectedReportView, columnApi])

  return (
    <>
      {showOnlyShowFilteredRecordSwitch && (
        <Box className="ag-grid-listing-grid-header-options border px-2 py-1 d-flex gap-2 justify-content-space-between">
          <div className="d-flex gap-2">
            <>
              <Divider orientation="vertical" flexItem className="mr-2" />

              <FormControlLabel
                value={checked}
                checked={checked}
                onChange={() => {
                  setChecked(!checked);

                  // if (gridDispatch) {
                  //     gridDispatch({
                  //         type: 'showFilteredRecordsOnly',
                  //         // showFilteredRecordsOnly: columnApi.getColumnState().filter((d) => ['asc', 'desc'].some((s) => s === d.sort))
                  //     });
                  // }
                }}
                control={<Switch size="small" color="primary" disabled={disableSelectionSwitch} />}
                style={{ fontSize: '0.8rem' }}
                label="Show Only Selected"
                labelPlacement="end"
              />
            </>
          </div>

          <div>
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
        </Box>
      )}
    </>
  );
}

export default CustomReactTableHeaderOptions;

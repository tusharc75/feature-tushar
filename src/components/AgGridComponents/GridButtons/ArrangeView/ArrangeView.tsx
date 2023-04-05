import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, Divider, FormControlLabel, Tooltip, Switch, IconButton } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';
import { CustomOfflineContext } from '../../../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../../../axios/axiosInstance';
import { useData } from '../../../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../../../constants/columns';
import { SET_GRID_METADATA } from '../../../../StateProvider/actionTypes';
import ArrangeViewDialog from './ArrangeViewDialog';
import ReportArrangeView from '../../ReportArrangeView';
import { BiFilterAlt } from 'react-icons/bi';
// import { BsArrowLeftRight } from 'react-icons/bs';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';

let timeout;

const ArrangeView = ({
  columns,
  setColumns,
  columnApi,
  renderedFrom = null,
  isClientSideGrid = false,
  dispatch: gridDispatch = null,
  saveColumnOptions = false,
  selectedReportView = null,
  setSelectedReportView = null,
  reportSave = false,
  style = {},
  ...otherProps
}) => {
  const [openColumnSelection, setOpenColumnSelection] = useState(false);

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

  return (
    <>
      <Tooltip title="Arrange View" placement="top">
        <IconButton
          {...otherProps}
          style={{
            width: '46px',
            height: '32px',
            background: 'white',
            padding: '11px',
            border: '1px solid #DEDEDE',
            color: '#424242',
            ...style
          }}
          aria-describedby="columnSelection"
          size="small"
          color="primary"
          onClick={(event) => {
            setOpenColumnSelection(true);
          }}
        >
          <SwapHorizIcon />
        </IconButton>
      </Tooltip>
      {openColumnSelection && (
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
      )}
    </>
  );
};

export default ArrangeView;

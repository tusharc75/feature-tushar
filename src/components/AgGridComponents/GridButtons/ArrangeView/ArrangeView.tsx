import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, Divider, FormControlLabel, Tooltip, Switch, IconButton } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';
import axiosInstance from '../../../../axios/axiosInstance';
import { useData } from '../../../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../../../constants/useColumns';
import { SET_GRID_METADATA } from '../../../../StateProvider/actionTypes';
import ArrangeViewDialog from './ArrangeViewDialog';
import ReportArrangeView from '../../ReportArrangeView';
import { BiFilterAlt } from 'react-icons/bi';
// import { BsArrowLeftRight } from 'react-icons/bs';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

let timeout;

const ArrangeView = ({
  columns,
  setColumns,
  defaultColumns,
  columnApi,
  renderedFrom = null,
  isClientSideGrid = false,
  dispatch: gridDispatch = null,
  saveColumnOptions = false,
  selectedReportView = null,
  setSelectedReportView = null,
  reportSave = false,
  className = '',
  style = {},
  refreshGrid,
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
      <HtmlTooltip title="Arrange View" placement="top" arrow>
        <IconButton
          {...otherProps}
          className={`refresh-arrange-button ${className}`}
          style={{
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
      </HtmlTooltip>
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
              refreshGrid={refreshGrid}
              defaultColumns={defaultColumns}
            />
          )}
        </>
      )}
    </>
  );
};

export default ArrangeView;

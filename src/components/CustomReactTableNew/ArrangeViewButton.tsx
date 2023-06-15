import React, { useContext, useEffect, useState } from 'react';
import { Tooltip, IconButton } from '@material-ui/core';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns } from '../../constants/useColumns';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import ArrangeViewDialog from './ArrangeViewDialog';

let timeout;

const ArrangeViewButton = ({
  columns,
  renderedFrom = null,
  isClientSideGrid = false,
  saveColumnOptions = false,
  setHiddenColumns = null,
  getToggleHideAllColumnsProps = null,
  setColumnOrder = null
}) => {
  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);

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
          aria-describedby="columnSelection"
          size="small"
          className="px-2  arrange-view-v2"
          onClick={(event) => {
            setOpenColumnSelection(true);
            setOpenColumnSelectionAnchorEl(event.currentTarget);
          }}
        >
          <SwapHorizIcon />
        </IconButton>
      </Tooltip>

      {openColumnSelection && (
        <>
          <ArrangeViewDialog
            columns={columns}
            onClose={() => setOpenColumnSelection(false)}
            updateGridHiddenColumns={updateGridHiddenColumns}
            saveColumnOptions={saveColumnOptions}
            columnApi={null}
            isClientSideGrid={isClientSideGrid}
            renderedFrom={renderedFrom}
            setHiddenColumns={setHiddenColumns}
            getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
            setColumnOrder={setColumnOrder}
          />
        </>
      )}
    </>
  );
};

export default ArrangeViewButton;

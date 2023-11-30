import { useState } from 'react';
import { IconButton } from '@material-ui/core';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import ArrangeViewDialog from './ArrangeViewDialog';
import HtmlTooltip from '../CustomTooltipTitle';

let timeout;

const ArrangeViewButton = ({
  columns,
  loading = false,
  renderedFrom = null,
  setHiddenColumns = null,
  getToggleHideAllColumnsProps = null,
  setColumnOrder = null,
  defaultColumns = null,
}) => {

  const [openColumnSelection, setOpenColumnSelection] = useState(false);

  const {
    state: { user }
  }: any = useData();
  const { dispatch }: any = useData();


  const updateGridHiddenColumns = (hiddenColumns = [], columnOrder = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let data = localStorage.getItem('gridMetaData');
      let request = data === 'undefined' ? {} : { ...JSON.parse(data) };
      if (request[renderedFrom]) {
        request[renderedFrom].order = columnOrder;
        request[renderedFrom].hide = hiddenColumns;
      } else {
        request[renderedFrom] = {
          order: columnOrder,
          hide: hiddenColumns,
        };
      }
      updateGridMetaData(request);
    }, 600);
  };

  const updateGridMetaData = (request) => {
    axiosInstance().post(`user/meta-grid`, {
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
          aria-describedby="columnSelection"
          size="small"
          color="primary"
          disabled={loading}
          className="refresh-arrange-button"
          onClick={(event) => {
            setOpenColumnSelection(true);
          }}
        >
          <SwapHorizIcon />
        </IconButton>
      </HtmlTooltip>

      {openColumnSelection && (
        <>
          <ArrangeViewDialog
            columns={columns}
            onClose={() => setOpenColumnSelection(false)}
            updateGridHiddenColumns={updateGridHiddenColumns}
            renderedFrom={renderedFrom}
            defaultColumns={defaultColumns}
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

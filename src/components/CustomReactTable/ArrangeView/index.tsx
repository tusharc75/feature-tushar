import { IconButton } from '@material-ui/core';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { useEffect, useMemo, useState } from 'react';
import ArrangeViewMenu from 'src/components/CustomReactTable/ArrangeView/ArrangeViewMenu';
import { useData } from '../../../StateProvider/Provider';
import { SET_GRID_METADATA } from '../../../StateProvider/actionTypes';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../CustomTooltipTitle';
import { TInitialState } from '../hooks/useTableReducer';
import { getGridMetaDataFromLocalStorage, getStickyColumnNames, getTableDataFromLocalStorage } from '../utils';
import ArrangeViewReportDialog from './ArrangeViewReportDialog';

let timeout;

const ArrangeView = ({
  columns,
  renderedFrom = null,
  getToggleHideAllColumnsProps = null,
  setSelectedReportView,
  selectedReportView,
  reportSave,
  dispatchTable,
  hideSelection,
  state,
  expander
}) => {
  const { loading }: TInitialState = state;

  const [openColumnSelection, setOpenColumnSelection] = useState(false);

  const {
    state: { user }
  }: any = useData();
  const { dispatch }: any = useData();

  const updateGridHiddenColumns = (hiddenColumns = [], columnOrder = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let request = getGridMetaDataFromLocalStorage();
      if (request[renderedFrom]) {
        request[renderedFrom].order = columnOrder;
        request[renderedFrom].hide = hiddenColumns;
      } else {
        request[renderedFrom] = {
          order: columnOrder,
          hide: hiddenColumns
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
      {reportSave ? (
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
      ) : (
        <ArrangeViewMenu
          dispatch={dispatchTable}
          renderedFrom={renderedFrom}
          state={state}
          columns={columns}
          hideSelection={hideSelection}
          expander={expander}
        />
      )}

      {openColumnSelection && (
        <>
          <ArrangeViewReportDialog
            columns={columns}
            onClose={() => setOpenColumnSelection(false)}
            updateGridHiddenColumns={updateGridHiddenColumns}
            renderedFrom={renderedFrom}
            getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
            dispatch={dispatchTable}
            setSelectedReportView={setSelectedReportView}
            selectedReportView={selectedReportView}
            state={state}
          />
        </>
      )}
    </>
  );
};

export default ArrangeView;

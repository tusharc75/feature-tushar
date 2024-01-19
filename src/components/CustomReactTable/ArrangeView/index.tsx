import { IconButton } from '@material-ui/core';
import SwapHorizIcon from '@material-ui/icons/SwapHoriz';
import { useEffect, useMemo, useState } from 'react';
import { useData } from '../../../StateProvider/Provider';
import { SET_GRID_METADATA } from '../../../StateProvider/actionTypes';
import axiosInstance from '../../../axios/axiosInstance';
import HtmlTooltip from '../../CustomTooltipTitle';
import ArrangeViewDialog from './ArrangeViewDialog';
import ArrangeViewReportDialog from './ArrangeViewReportDialog';
import { TInitialState } from '../hooks/useTableReducer';
import { getTableDataFromLocalStorage, getStickyColumnNames } from '../utils';

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

  const stickycolumns = useMemo(
    () => getStickyColumnNames({ allColumn: columns, hideSelection: hideSelection, expander: expander }),
    [columns, expander, hideSelection]
  );

  useEffect(() => {
    const gridMetaData = getTableDataFromLocalStorage(renderedFrom);
    if (gridMetaData && gridMetaData?.order && gridMetaData?.order?.length) {
      let tempColumnOrder = [];
      tempColumnOrder = [...stickycolumns.left, ...gridMetaData.order, ...stickycolumns.right];
      dispatchTable({ type: 'setColumnOrder', columnOrder: tempColumnOrder });
    }
    if (gridMetaData && gridMetaData?.hide && gridMetaData?.hide?.length) {
      const visibleColumns = {};
      for (const col of columns) {
        visibleColumns[col.id] = !gridMetaData.hide?.includes(col.id);
      }
      dispatchTable({ type: 'setVisibleColumns', visibleColumns: visibleColumns });
    }
    else {
      const visibleColumns = {};
      columns.forEach((col) => {
        visibleColumns[col.id] = col?.show === false ? false : true;
      });
      dispatchTable({ type: 'setVisibleColumns', visibleColumns });
    }
  }, [renderedFrom]);

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
          {reportSave ? (
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
          ) : (
            <ArrangeViewDialog
              columns={columns}
              onClose={() => setOpenColumnSelection(false)}
              updateGridHiddenColumns={updateGridHiddenColumns}
              renderedFrom={renderedFrom}
              getToggleHideAllColumnsProps={getToggleHideAllColumnsProps}
              dispatch={dispatchTable}
              state={state}
              stickycolumns={stickycolumns}
            />
          )}
        </>
      )}
    </>
  );
};

export default ArrangeView;

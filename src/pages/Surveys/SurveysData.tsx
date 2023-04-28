import { Box, IconButton } from '@material-ui/core';
import { camelCase } from 'lodash';
import React, { useContext, useReducer, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import useColumns from 'src/constants/useColumns';
import { getFrameworkComponents } from 'src/constants/useColumns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const SurveysData = ({ surveyId }) => {
  const renderedFrom = camelCase(routes?.surveys.title);
  const toastConfig = useContext(CustomToastContext);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });
  const {
    state: { permissions }
  }: any = useData();
  const { dataRows, rowCount, loading, page, pageSizes, search, filters, sorting, selectedRecords, limit, appendRows } = state;

  const { getColumnData } = useColumns();

  React.useEffect(() => {
    fetchGridColumns();
    fetchData();
  }, []);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`surveys/fields/${surveyId}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o, routes.surveysDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns];
        setColumns([...columns]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    axiosInstance()
      .get(`/surveys/${surveyId}/data`)
      .then(({ data }) => {
        dispatch({
          type: 'initialize',
          data: data?.data,
          count: data?.data.length
        });
        dispatch({ type: 'loading', loading: false });
      })
      .catch((err) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(err);
      });
  };

  const NameRenderer = (params) => {
    return <span className=" d-flex gap-2 align-items-center">{params.value}</span>;
  };

  const ActionsRenderer = (params) => (
    <>
      {permissions?.surveys?.isDelete && (
        <>
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowConfirmBox({ open: true, ids: [params?.data?._id] });
              }}
            >
              <DeleteIcon color="error" fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </>
      )}
    </>
  );

  const handleDelete = () => { };

  return (
    <div>
      {columns && frameWorkComponent ? (
        <CustomAgGrid
          allowSelection={permissions?.surveys?.isUpdate}
          allowAction={permissions?.surveys?.isUpdate}
          columns={columns}
          dataRows={dataRows}
          isClientSideGrid={true}
          frameworkComponents={frameWorkComponent}
          setGridApi={setGridApi}
          dispatch={dispatch}
          rowCount={rowCount}
          limit={limit}
          pageSizes={pageSizes}
          page={page}
          actionWidth={150}
          loading={loading}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
        />
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}

      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete this step(s)?`}
          okBtnLoading={false}
          onClose={() => {
            setShowConfirmBox({ open: false, ids: null });
          }}
          onOk={handleDelete}
        />
      )}
    </div>
  );
};

export default SurveysData;

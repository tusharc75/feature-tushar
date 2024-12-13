import { Box, IconButton } from '@material-ui/core';
import { camelCase } from 'lodash';
import React, { useContext, useState, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { sidebarResource } from 'src/constants/helpers';

const SurveysData = ({ surveyId }) => {
  const renderedFrom = camelCase(sidebarResource?.surveys);
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, ids: null });
  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const { generateColumns } = useColumns();

  React.useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`surveys/fields/${surveyId}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.surveysDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
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

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            onClick={() => {
              setShowConfirmBox({ open: true, ids: [row?.original?._id] });
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const handleDelete = () => {};

  return (
    <div>
      {columns ? (
        <CustomReactTable
          height={'calc(100vh - 200px)'}
          columns={columns}
          state={state}
          dispatch={dispatch}
          renderedFrom={renderedFrom}
          refreshGrid={fetchData}
          showOnlyShowFilteredRecordSwitch={true}
        />
      ) : (
        <Box p={2} height={500}>
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

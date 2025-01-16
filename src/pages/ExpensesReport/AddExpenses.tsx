import { Box, Dialog } from '@mui/material';
import { useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import axios, { CancelTokenSource } from 'axios';
import { useData } from '../../StateProvider/Provider';
import {
  gridLoadingTimeout,
  prepareDataForGrid,
  expenses,
} from '../../constants/helpers';

function AddExpenses({
  open,
  onClose,
  fullScreen,
  setFullScreen,
  isSubmitting
}) {
  const renderedFrom = camelCase(sidebarResource?.expenses);
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, search, filters, sorting, showFilteredRecordsOnly } = state;
  const {
    state: { user, permissions }
  }: any = useData();

    useEffect(() => {
      fetchGridColumns();
    }, []);

    useEffect(() => {
      const cancelTokenSource = axios.CancelToken.source();
      fetchData(cancelTokenSource);
      return () => cancelTokenSource.cancel();
    }, [page, limit, filters, sorting, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.expenses}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes?.expensesDetail?.path, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(renderedFrom, field));
    });
    setColumns(newColumns);
  };

    const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
      dispatch({ type: 'loading', loading: true });
        let data: any = [], count;
        const response: any = await axiosInstance().get(`${expenses.api}`);
        data = response?.data?.data;
        count = response?.data?.count;
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u, user);
          finalObject['isChecked'] = false;
          finalObject['canDelete'] = permissions?.expenses?.isDelete;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
    };
  
  return (
    <Dialog
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      open={open}
    >
      <CustomDialogHeader
        title="Add Expense to Report"
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
      {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            resource={sidebarResource?.expenses}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(8).keys()]} />
          </Box>
        )}
      </CustomDialogContent>
      <CustomDialogFooter>
        <ThemeButton buttonType="transparent" id="dialog-cancel-button" onClick={onClose}>
          Cancel
        </ThemeButton>
        <ThemeButton isLoading={isSubmitting} buttonType="theme" id="dialog-save-button" disabled={isSubmitting} onClick={onClose}>
          Save
        </ThemeButton>
      </CustomDialogFooter>
    </Dialog>
  );
}

export default AddExpenses;

import { Box, Dialog, TextField } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import { CustomDialogTransition, EXPENSE_STATUS, expenseReport, sidebarResource } from '../../constants/helpers';
import Expenses from 'src/pages/ExpensesReport/Expenses';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';

const Requests = ({ referenceId, fetchDataMaster }) => {
  const toastConfig = useContext(CustomToastContext);
  const [fields, setFields] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rowsData, setRowsData] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (referenceId) {
      fetchData();
      fetchFields();
      fetchPolicy();
    }
  }, [referenceId]);

  const fetchData = () => {
    setRowsData(null);
    axiosInstance()
      .get(`${expenseReport.api}/${referenceId}`)
      .then(({ data: { data } }) => {
        setRowsData(data);
        setLoadingDetails(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoadingDetails(false);
      });
  };

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.expenseReport}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.expenses}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleStatusChange = (status) => {
    if (!rowsData) return;
    try {
      axiosInstance().patch(`${expenseReport.api}/status/${rowsData._id}`, { status });
      fetchDataMaster();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const openRejectDialog = () => {
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSave = () => {
    if (!rowsData) return;
    const updatedData = {
      _id: rowsData._id,
      expenses: rowsData.expenses,
      fromDate: rowsData.fromDate,
      reportTitle: rowsData.reportTitle,
      status: EXPENSE_STATUS.rejected,
      toDate: rowsData.toDate,
      rejectReason: rejectReason,
      users: [...rowsData.users.map((user) => user.optionValue)]
    };

    axiosInstance()
      .put(`${expenseReport.api}`, updatedData)
      .then(() => {
        setRejectDialogOpen(false);
        fetchDataMaster();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box display="flex" marginBottom="0.5rem" gap="1rem" justifyContent="flex-end">
          {rowsData?.status !== EXPENSE_STATUS.reimbursed && <Fragment>
            {rowsData?.status !== EXPENSE_STATUS.approved ? (
              <>
                <ThemeButton
                  buttonType="themeBorder"
                  onClick={() => {
                    handleStatusChange(EXPENSE_STATUS.approved);
                  }}
                >
                  APPROVE
                </ThemeButton>
                <ThemeButton buttonType="red" onClick={openRejectDialog}>
                  REJECT
                </ThemeButton>
              </>
            ) : (
              <>
                <ThemeButton
                  buttonType="themeBorder"
                  onClick={() => {
                    handleStatusChange(EXPENSE_STATUS.reimbursed);
                  }}
                >
                  REIMBURSED
                </ThemeButton>
              </>
            )}
          </Fragment>}
        </Box>
        <Box className="detail-container-v1">
          <Box>
            {!loadingDetails && rowsData && fields ? (
              <DetailsPage data={rowsData} fields={fields} />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
          <Box>
            {!loadingDetails && rowsData && fields ? (
              <div className="mt-2">
                <Expenses
                  expenseIds={rowsData?.expenses?.map((expense) => expense._id)}
                  showAddButton={true}
                  reportData={rowsData}
                  removeRow={null}
                  allowedToEdit={false}
                />
              </div>
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </Box>
      </Box>
      <Dialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
      >
        <CustomDialogHeader
          title="Reason for Rejection"
          onClose={null} 
          showManimizeMaximize={false}
        />
        <CustomDialogContent>
          <TextField
          autoFocus
            id="outlined-multiline-static"
            label="State Your reason for Rejection"
            fullWidth
            required
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton buttonType="theme" onClick={handleRejectSave} disabled={!rejectReason.trim()}>
            Save
          </ThemeButton>
        </CustomDialogFooter>
      </Dialog>
    </>
  );
};

export default Requests;

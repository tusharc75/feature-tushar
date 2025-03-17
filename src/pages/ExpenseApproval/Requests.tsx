import { Box } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import { EXPENSE_STATUS, expenseReport, sidebarResource } from '../../constants/helpers';
import Expenses from 'src/pages/ExpensesReport/Expenses';
import CommentDialog from 'src/components/CommentDialog';

const Requests = ({ referenceId, fetchDataMaster }) => {

  const toastConfig = useContext(CustomToastContext);
  const [fields, setFields] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rowsData, setRowsData] = useState(null);
  const [commentDialog, setCommentDialog] = useState(false);

  useEffect(() => {
    if (referenceId) {
      fetchData();
      fetchFields();
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

  const handleStatusChange = (status, comment = '') => {
    axiosInstance().patch(`${expenseReport.api}/status/${rowsData._id}`, { status, comment })
      .then(({ data }) => {
        fetchDataMaster();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
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
                Approve
              </ThemeButton>
              <ThemeButton
                buttonType="red"
                onClick={() => {
                  setCommentDialog(true)
                }}
              >
                Reject
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
                Reimbursed
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
            <Expenses
              expenseIds={rowsData?.expenses}
              showAddButton={true}
              reportData={rowsData}
              removeRow={null}
              allowedToEdit={false}
            />
          ) : (
            <div className="p-2">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </div>
          )}
        </Box>
      </Box>
      {commentDialog && (
        <CommentDialog
          required={true}
          handleSubmit={(data) => {
            handleStatusChange(EXPENSE_STATUS.rejected, data);
            setCommentDialog(false);
          }}
          handleClose={() => {
            setCommentDialog(false);
          }}
        />
      )}
    </>
  );
};

export default Requests;

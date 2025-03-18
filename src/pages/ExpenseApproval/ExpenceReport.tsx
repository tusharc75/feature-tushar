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

const Requests = ({ expenceReportId, fetchExpenceReportData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [fields, setFields] = useState(null);
  const [expenceReportData, setExpenceReportData] = useState(null);
  const [commentDialog, setCommentDialog] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  useEffect(() => {
    if (expenceReportId) {
      fetchData();
    }
  }, [expenceReportId]);

  const fetchData = () => {
    setExpenceReportData(null);
    axiosInstance()
      .get(`${expenseReport.api}/${expenceReportId}`)
      .then(({ data: { data } }) => {
        setExpenceReportData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
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
    axiosInstance()
      .patch(`${expenseReport.api}/status/${expenceReportData._id}`, { status, comment })
      .then(({ data }) => {
        fetchExpenceReportData();
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
      <Box className="flex justify-end gap-4 pb-5">
        {expenceReportData?.status !== EXPENSE_STATUS.reimbursed && (
          <Fragment>
            {expenceReportData?.status !== EXPENSE_STATUS.approved ? (
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
                    setCommentDialog(true);
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
          </Fragment>
        )}
      </Box>
      <Box className="detail-container-v1 max-h-[calc(100vh-300px)] !min-h-[660px] overflow-y-auto pt-0">
        <Box>
          {expenceReportData && fields ? (
            <DetailsPage data={expenceReportData} fields={fields} />
          ) : (
            <div className="p-2">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </div>
          )}
        </Box>
        <Box>
          {expenceReportData && fields ? (
            <Expenses expenseIds={expenceReportData?.expenses} allowedToEdit={false} />
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

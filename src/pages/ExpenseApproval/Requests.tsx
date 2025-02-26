import { Box } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import { EXPENSE_STATUS, expenseReport, sidebarResource } from '../../constants/helpers';
import Expenses from 'src/pages/ExpensesReport/Expenses';

const Requests = ({ referenceId, fetchDataMaster }) => {
  const toastConfig = useContext(CustomToastContext);
  const [fields, setFields] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rowsData, setRowsData] = useState(null);
  const [resourceData, setResourceData] = useState(null);

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

  return (
    <>
      <Box className="main-container-v1">
        <Box display="flex" marginBottom={'0.5rem'} gap={'1rem'} justifyContent="flex-end">
          <Fragment>
            {rowsData?.status !== EXPENSE_STATUS.approved && (
              <>
                <ThemeButton
                  buttonType="themeBorder"
                  onClick={() => {
                    handleStatusChange(EXPENSE_STATUS.approved);
                  }}
                >
                  APPROVE
                </ThemeButton>
                <ThemeButton
                  buttonType="red"
                  onClick={() => {
                    handleStatusChange(EXPENSE_STATUS.rejected);
                  }}
                >
                  REJECT
                </ThemeButton>
              </>
            )}
          </Fragment>
        </Box>
        <Box className={`detail-container-v1`}>
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
    </>
  );
};

export default Requests;

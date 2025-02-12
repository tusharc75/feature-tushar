import { Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import SendIcon from '@mui/icons-material/Send';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { EXPENSE_STATUS, expenseReport, expenses, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import ManageExpenseReports from 'src/pages/ExpensesReport/ManageExpenseReports';
import Expenses from 'src/pages/ExpensesReport/Expenses';
import { CardInterface } from 'src/components/CustomTableWithCard';

const Requests = ({ referenceId, fetchDataMaster, isMobile = false }) => {
  const toastConfig = useContext(CustomToastContext);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [accessor, setAccessor] = useState<CardInterface | null>(null);
  const [resourceData, setResourceData] = useState(null);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    console.log(referenceId);
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
        setLoadingDetails(false);
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

  const handleStatusChange = async (status) => {
    if (!rowsData) return;
    try {
      for (let report of rowsData) {
        await axiosInstance().patch(`${expenseReport.api}/status/${report._id}`, { status });
        if (report.expenses && report.expenses.length > 0) {
          for (let expense of report.expenses) {
            await axiosInstance().patch(`${expenses.api}/status/${expense.id}`, { status });
          }
        }
      }
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <>
      <Box className="main-container-v1">
        <Box className="headerbox-v1" display="flex" justifyContent="flex-end">
          <Box className="controls-v1">
            <Box className="control-buttons-v1 " >
              <Fragment>
                {rowsData?.status !== EXPENSE_STATUS.approved && (
                  <>
                    <ThemeButton
                      buttonType="themeBorder"
                      iconForMobile={<SendIcon />}
                      onClick={() => {
                        handleStatusChange(
                          rowsData?.status === EXPENSE_STATUS.awaitingApproval ? EXPENSE_STATUS.recalled : EXPENSE_STATUS.awaitingApproval
                        );
                      }}
                      mobileTooltip={rowsData?.status === EXPENSE_STATUS.awaitingApproval ? 'Recall' : 'Send For Approval'}
                    >
                     Approve
                    </ThemeButton>
                    <ThemeButton
                      buttonType="red"
                      iconForMobile={<SendIcon />}
                      onClick={() => {
                        handleStatusChange(
                          rowsData?.status === EXPENSE_STATUS.awaitingApproval ? EXPENSE_STATUS.recalled : EXPENSE_STATUS.awaitingApproval
                        );
                      }}
                      mobileTooltip={rowsData?.status === EXPENSE_STATUS.awaitingApproval ? 'Recall' : 'Send For Approval'}
                    >
                      Reject
                    </ThemeButton>
                  </>
                )}
              </Fragment>
            </Box>
          </Box>
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
                    selectedExpenseData={rowsData?.expenses}
                    showAddButton={true}
                    reportData={rowsData}
                    removeRow={null}
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

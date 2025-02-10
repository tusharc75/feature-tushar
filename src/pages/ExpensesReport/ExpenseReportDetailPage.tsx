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

const ExpenseReportDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { permissions, resources }
  }: any = useData();
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [expenseReportData, setExpenseReportData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [fields, setFields] = useState(null);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          setTabValue(tab ? parseInt(tab) : 0);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          setTabValue(tab ? parseInt(tab) : 0);
        }
      }
    });
  }, [locationKeys]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

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

  const fetchData = async () => {
    setLoadingDetails(true);
    axiosInstance()
      .get(`${expenseReport.api}/${id}`)
      .then(({ data: { data } }) => {
        setLoadingDetails(false);
        setAllowedToEdit(permissions?.expenseReport?.isUpdate);
        setAllowedToDelete(permissions?.expenseReport?.isDelete && data?.canDelete);
        setExpenseReportData(data);
      })
      .catch((err) => {
        setLoadingDetails(false);
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

  const handleDelete = async () => {
    try {
      await axiosInstance().put(`${expenseReport.api}/remove`, { ids: [expenseReportData._id] });

      if (expenseReportData?.expenses?.length > 0) {
        for (let expense of expenseReportData.expenses) {
          try {
            await axiosInstance().patch(`${expenses.api}/status/${expense._id}`, {
              status: EXPENSE_STATUS.unreported
            });
          } catch (error) {
            toastConfig.setToastConfig(error);
          }
        }
      }

      setShowConfirmBox(false);

      history.push(`${routes?.expenseReport?.path}`);
    } catch (error) {
      toastConfig.setToastConfig(error);
      setShowConfirmBox(false);
    }
  };

  const handleDeleteExpense = async (expenseIds: string[]) => {
    try {
      await axiosInstance().put(
        `${routes.expenseReport.path}/expenses/${expenseReportData._id}/remove`,
        { ids: expenseIds }
      );

      for (let expenseId of expenseIds) {
        await axiosInstance().patch(`${expenses.api}/status/${expenseId}`, {
          status: EXPENSE_STATUS.unreported
        });
      }

      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleStatusChange = async (status) => {
    await axiosInstance().patch(`${expenseReport.api}/status/${expenseReportData._id}`, {
      status
    });
    if (expenseReportData?.expenses?.length > 0) {
      for (let expense of expenseReportData.expenses) {
          await axiosInstance().patch(`${expenses.api}/status/${expense._id}`, {
            status
          });
      }
    }
    fetchData();
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.expenseReport, title: resources?.expenseReport?.titlePlural },
              { title: `${expenseReportData ? expenseReportData?.reportTitle : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Fragment>
            {expenseReportData?.status !== EXPENSE_STATUS.approved && (
              <>
              <ThemeButton
                iconForMobile={<Edit />}
                disabled={!allowedToEdit}
                onClick={() => {
                  setOpenUpdateDialog(true);
                }}
                mobileTooltip={'Edit'}
              >
                Edit
              </ThemeButton>
               <ThemeButton
                buttonType="theme"
                iconForMobile={<SendIcon />}
                onClick={() => {
                  handleStatusChange(
                    expenseReportData?.status === EXPENSE_STATUS.awaitingApproval ? EXPENSE_STATUS.recalled : EXPENSE_STATUS.awaitingApproval
                  );
                }}
                mobileTooltip={expenseReportData?.status === EXPENSE_STATUS.awaitingApproval ? 'Recall' : 'Send For Approval'}
              >
                {expenseReportData?.status === EXPENSE_STATUS.awaitingApproval ? 'Recall' : 'Send For Approval'}
              </ThemeButton>
              </>
              )}
            </Fragment>
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Expenses</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {!loadingDetails && expenseReportData && fields ? (
              <DetailsPage data={expenseReportData} fields={fields} />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box>
            {!loadingDetails && expenseReportData && fields ? (
              <div className="mt-2">
                <Expenses selectedExpenseData={expenseReportData?.expenses} showAddButton={true} reportData={expenseReportData} removeRow={handleDeleteExpense} />
              </div>
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.expenseReport}
                  data={expenseReportData}
                  allowedToEdit={permissions?.expenseReport?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.expenseReport?.titleSingular?.toLowerCase()} : ${expenseReportData?.reportTitle} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageExpenseReports
          expenseReportId={id}
          fetchReportData={fetchData}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default ExpenseReportDetailsPage;

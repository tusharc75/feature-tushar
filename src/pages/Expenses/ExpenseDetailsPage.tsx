import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
import React, { Fragment, useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import Steps from 'src/components/Steps';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';

import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import {
  SERVICE_ORDER_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  expenses,
  serviceOrderSteps,
  sidebarResource
} from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import ManageExpenses from 'src/pages/Expenses/ManageExpenses';

const ServiceOrderDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [expensesData, setExpensesData] = useState(null);

  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [serviceOrderFields, setServiceOrderFields] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [locationKeys, setLocationKeys] = useState([]);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [nextStep, setNextStep] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);

  const [steps, setSteps] = useState(serviceOrderSteps);
  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  const { isOffline } = useContext(CustomOfflineContext);

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
      getFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      let data;
      const response: any = await axiosInstance().get(`${expenses.api}/${id}`);
      data = response?.data?.data;
      setLoadingDetails(false);

      setAllowedToEdit(permissions?.expenses?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.expenses, data));
      setAllowedToDelete(permissions?.expenses?.isDelete && checkIsAllowedToDelete(user, sidebarResource.expenses, data.owner.optionValue));
      setExpensesData(data);
    } catch (error) {
      setLoadingDetails(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.expenses}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getFields = async () => {
    try {
      let data: any;
      const response = await axiosInstance().get(`/field/field-policy?resource=${sidebarResource.expenses}`);
      data = response?.data?.data?.field;
      setServiceOrderFields(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${expenses.api}/remove`, { ids: [expensesData._id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.expenses?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleChangeStatus = (status) => {
    if (isOffline) return;
    axiosInstance()
      .patch(`${routes?.expenses?.path}/status/${expensesData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchData();
        setShowClosedConfirmBox(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };
  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.expenses, title: resources?.expenses?.titlePlural },
              { title: `${expensesData ? expensesData?.expensesNumber : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          {!isOffline && (
            <Box className="control-buttons-v1">
              {allowedToEdit && expensesData?.canComplete && SERVICE_ORDER_STATUS.closed !== expensesData.status && (
                <ButtonWithPulse
                  onClick={() => {
                    setShowClosedConfirmBox(true);
                  }}
                >
                  Close
                </ButtonWithPulse>
              )}
              <Fragment>
                <ThemeButton iconForMobile={<Edit />} disabled={!allowedToEdit} onClick={handleOpenUpdateDialog}>
                  Edit
                </ThemeButton>
              </Fragment>
              <DeleteButton text="Delete" disabled={!allowedToDelete} onClick={() => setShowConfirmBox(true)} />
            </Box>
          )}
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {!loadingDetails && expensesData && serviceOrderFields.length > 0 ? (
              <DetailsPage data={expensesData} fields={serviceOrderFields} />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>

        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={steps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={[SERVICE_ORDER_STATUS.completed, SERVICE_ORDER_STATUS.closed].includes(expensesData?.status)}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                if (!isOffline) {
                  dynamicFormUpdateProcessStatus(sidebarResource.expenses, steps[step]?.name, id);
                }
              }}
            />
          </TabPanel>
        </ContentFullScreen>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.expenses}
                  data={expensesData}
                  allowedToEdit={permissions?.expenses?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.expenses?.titleSingular?.toLowerCase()} : ${expensesData?.expensesNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ${expensesData?.expensesNumber} ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(SERVICE_ORDER_STATUS.closed);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageExpenses
          isClone={false}
          expenseId={id}
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

export default ServiceOrderDetailsPage;

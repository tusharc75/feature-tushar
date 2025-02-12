import { Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
import { useContext, useEffect, useMemo, useState } from 'react';
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
import { disassemblyOrder, disassemblyOrderSteps, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import { ManageDiassemblyOrder } from 'src/pages/DisassemblyOrder/ManageDiassemblyOrder';
import ContentFullScreen from 'src/components/ContentFullScreen';
import Steps, { getIndex } from 'src/components/Steps';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import Material from 'src/pages/DisassemblyOrder/Material';
import { camelCase } from 'lodash';
import WorkOrder from 'src/pages/DisassemblyOrder/WorkOrder';

const DisassemblyOrderDetail = () => {
  const renderedFrom = camelCase(sidebarResource.disassemblyOrder);
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { permissions, resources }
  }: any = useData();

  const [disassemblyOrderData, setDisassemblyOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [fields, setFields] = useState(null);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);

  const disassemblyOrderProcessStepsNames = useMemo(() => {
    return disassemblyOrderSteps.map((item) => item.name);
  }, [disassemblyOrderSteps]);

  useEffect(() => {
    fetchFields();
    fetchPolicy();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.disassemblyOrder}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${disassemblyOrder.api}/${id}`)
      .then(({ data: { data } }) => {
        setCurrentStep(getIndex(data?.processStatus, disassemblyOrderSteps));
        setAllowedToEdit(permissions?.disassemblyOrder?.isUpdate);
        setAllowedToDelete(permissions?.disassemblyOrder?.isDelete);
        setDisassemblyOrderData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.disassemblyOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${disassemblyOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.disassemblyOrder?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.disassemblyOrder, title: resources?.disassemblyOrder?.titlePlural },
              { title: `${disassemblyOrderData ? disassemblyOrderData?.disassemblyOrderNumber : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {allowedToEdit && (
              <ThemeButton iconForMobile={<Edit />} onClick={() => setOpenUpdateDialog(true)}>
                Edit
              </ThemeButton>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={(e, newValue) => setTabValue(Number(newValue))}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {resourceData?.tabs?.map((tab, i) => (
            <CustomTab value={i + 2} key={i}>
              {tab?.tabName}
            </CustomTab>
          ))}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {disassemblyOrderData && fields ? (
            <DetailsPage data={disassemblyOrderData} fields={fields} />
          ) : (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          )}
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={disassemblyOrderSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={false}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.disassemblyOrder, disassemblyOrderProcessStepsNames[step], id);
              }}
            />
            {disassemblyOrderProcessStepsNames[currentStep] === 'Add' && disassemblyOrderData && (
              <Material
                disassemblyOrderData={disassemblyOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
            {disassemblyOrderProcessStepsNames[currentStep] === 'Work Order' && disassemblyOrderData && (
              <WorkOrder
                disassemblyOrderData={disassemblyOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-2`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )}
          </TabPanel>
        </ContentFullScreen>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => (
            <TabPanel value={tabValue} index={i + 2} key={i}>
              <Step
                tab={tab}
                resourcePolicyId={resourceData?._id}
                resourceId={id}
                resource={sidebarResource.disassemblyOrder}
                data={disassemblyOrderData}
                allowedToEdit={permissions?.disassemblyOrder?.isUpdate}
              />
            </TabPanel>
          ))}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.disassemblyOrder?.titleSingular?.toLowerCase()} : ${disassemblyOrderData?.disassemblyOrderNumber} ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageDiassemblyOrder
          isClone={false}
          disassemblyOrderId={id}
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

export default DisassemblyOrderDetail;

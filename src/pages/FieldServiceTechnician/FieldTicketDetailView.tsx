import { Box } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import ContentFullScreen from 'src/components/ContentFullScreen';
import routes from 'src/components/Helpers/Routes';
import Steps, { getIndex } from 'src/components/Steps';
import {
  FIELD_TICKET_STATUS,
  checkIsAllowedToEdit,
  fieldTicket,
  fieldTicketSteps,
  sidebarResource
} from 'src/constants/helpers';
import Submit from 'src/pages/FieldTicket/Submit';
import Material from 'src/pages/FieldTicket/material';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';

const FieldTicketDetailView = ({ id }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();
  const [fieldTicketData, setFieldTicketData] = useState(null);
  const [fields, setFields] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepFullScreen, setStepFullScreen] = useState(false);

  const [nextStep, setNextStep] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    try {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource?.fieldTicket}`);
      const data = response?.data?.data;
      setFields(data?.filter((field) => field.isRead));
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    try {
      setFieldTicketData(null);
      const response = await axiosInstance().get(`${routes.fieldTicket.path}/${id}`);
      const data = response?.data?.data;
      if ([FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.readyToInvoice, FIELD_TICKET_STATUS.closed]?.includes(data?.status)) {
        setCurrentStep(fieldTicketSteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, fieldTicketSteps));
      }

      setAllowedToEdit(permissions?.fieldTicket?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.fieldTicket, data));
      setFieldTicketData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.fieldTicket}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleChangeStatus = async (status) => {
    await axiosInstance()
      .patch(`${fieldTicket.api}/status/${fieldTicketData._id}`, { status })
      .then(({ data }) => {
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
    <Box className="main-container-v1">
      <Box className="detail-container-v1">
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            isPrevStep={fieldTicketData?.status === FIELD_TICKET_STATUS.readyToInvoice ? false : true}
            steps={fieldTicketSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[FIELD_TICKET_STATUS.invoiced, FIELD_TICKET_STATUS.closed].includes(fieldTicketData?.status)}
            stepFullScreen={stepFullScreen}
            setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
            updateStatus={(step: number) => {
              dynamicFormUpdateProcessStatus(sidebarResource.fieldTicket, fieldTicketSteps[step]?.name, id);
            }}
          />
          {currentStep === 0 && fieldTicketData && (
            <Material
              fieldTicketData={fieldTicketData}
              fieldTicketFields={fields}
              allowedToEdit={allowedToEdit}
              setNextStep={setNextStep}
              handleChangeStatus={handleChangeStatus}
              resourcePolicy={resourceData?.policy}
              stepFullScreen={stepFullScreen}
              fetchData={fetchData}
            />
          )}
          {currentStep === 1 && fieldTicketData && (
            <Submit
              stepFullScreen={stepFullScreen}
              fieldTicketData={fieldTicketData}
              allowedToEdit={allowedToEdit}
              fetchData={fetchData}
              resourcePolicy={resourceData?.policy}
            />
          )}
        </ContentFullScreen>
      </Box>
    </Box>
  );
};

export default FieldTicketDetailView;

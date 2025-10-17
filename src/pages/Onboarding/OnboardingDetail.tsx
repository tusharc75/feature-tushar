import { Box } from '@mui/material';
import { Edit, Email } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import DetailsPage from 'src/components/Shared/DetailsPage';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { sidebarResource } from 'src/constants/helpers';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import ManageOnboarding from './ManageOnboarding';
import Step from 'src/pages/DynamicForm/Step';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';

const OnboardingDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [onboardingData, setOnboardingData] = useState(null);
  const [onboardingTemplateData, setOnboardingTemplateData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [resourcePolicyData, setResourcePolicyData] = useState(null);

  useEffect(() => {
    fetchFields();
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.onboarding, permissions?.onboarding?.isUpdate);
    setFields(fieldsDataForRead);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { data: onboardingData } } = await axiosInstance().get(`${routes.onboarding.path}/${id}`);
      if (onboardingData.onboardingTemplateData) {
        setOnboardingTemplateData(onboardingData.onboardingTemplateData);
      }
      setAllowedToEdit(permissions?.onboarding?.isUpdate);
      setAllowedToDelete(permissions?.onboarding?.isDelete);
      setOnboardingData(onboardingData);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.onboarding)
    setResourcePolicyData(data)
  };

  const handleSendEmail = async () => {
    setLoading(true);
    try {
      await axiosInstance().post(`${routes.onboarding.path}/${id}/send-email`);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Email sent successfully'
      });
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.onboarding.path}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.onboarding?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const onboardingTabsCount = onboardingTemplateData?.tabs?.length || 0;
  const resourcePolicyStartIndex = 1 + onboardingTabsCount;

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.onboarding, title: resources?.onboarding?.titlePlural },
              { title: `${onboardingData ? onboardingData?.onboardingNumber : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <ThemeButton
              buttonType='theme'
              iconForMobile={<Email />}
              onClick={handleSendEmail}
              disabled={loading}
              mobileTooltip="Send Email"
            >
              Send Email
            </ThemeButton>
            {allowedToEdit && (
              <ThemeButton
                iconForMobile={<Edit />}
                onClick={() => setOpenUpdateDialog(true)}
                mobileTooltip="Edit"
              >
                Edit
              </ThemeButton>
            )}
            {allowedToDelete && (
              <DeleteButton
                text="Delete"
                onClick={() => setShowConfirmBox(true)}
              />
            )}
          </Box>
        </Box>
      </Box>

      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          {onboardingTemplateData?.tabs?.map((tab, i) => (
            <CustomTab key={`onboarding-${i}`} value={i + 1}>
              {tab?.tabName}
            </CustomTab>
          ))}
          {resourcePolicyData?.tabs?.map((tab, i) => (
            <CustomTab key={`policy-${i}`} value={resourcePolicyStartIndex + i}>
              {tab?.tabName}
            </CustomTab>
          ))}
        </CustomTabs>

        <TabPanel value={tabValue} index={0}>
          {loading || !fields ? (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          ) : (
            <DetailsPage
              data={onboardingData}
              fields={fields}
            />
          )}
        </TabPanel>

        {onboardingTemplateData &&
          onboardingTemplateData?.tabs?.length > 0 &&
          onboardingTemplateData?.tabs?.map((tab, i) => (
            <TabPanel key={`onboarding-panel-${i}`} value={tabValue} index={i + 1}>
              <Step
                tab={tab}
                onboardingTemplateId={onboardingTemplateData._id}
                resourceId={id}
                resource={sidebarResource.onboarding}
                data={onboardingTemplateData}
                allowedToEdit={permissions?.onboarding?.isUpdate ? allowedToEdit : false}
              />
            </TabPanel>
          ))
        }
        {resourcePolicyData &&
          resourcePolicyData?.tabs?.length > 0 &&
          resourcePolicyData?.tabs?.map((tab, i) => (
            <TabPanel key={`policy-panel-${i}`} value={tabValue} index={resourcePolicyStartIndex + i}>
              <Step
                tab={tab}
                resourcePolicyId={resourcePolicyData?._id}
                resourceId={id}
                resource={sidebarResource.onboarding}
                data={onboardingTemplateData}
                allowedToEdit={permissions?.onboarding?.isUpdate ? allowedToEdit : false}
              />
            </TabPanel>
          ))
        }
      </Box>

      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.onboarding?.titleSingular?.toLowerCase()}: ${onboardingData?.componentName}?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManageOnboarding
          id={id}
          isClone={false}
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

export default OnboardingDetail;
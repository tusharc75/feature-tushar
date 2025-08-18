import { Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
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
import Step from 'src/pages/DynamicForm/Step';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import ManageOnboardingTemplate from 'src/pages/OnboardingTemplate/ManageOnboardingTemplate';

const OnboardingTemplateDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [onboardingTemplateData, setOnboardingTemplateData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourcePolicyData, setResourcePolicyData] = useState(null);
  const [fields, setFields] = useState(null);

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
    const { fieldsDataForRead } = await fetch_resource_view_fields(
      sidebarResource.onboardingTemplate, 
      permissions?.onboardingTemplate?.isUpdate
    );
    setFields(fieldsDataForRead);
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${routes.onboardingTemplate.path}/${id}`)
      .then(({ data: { data } }) => {
        setAllowedToEdit(permissions?.onboardingTemplate?.isUpdate);
        setAllowedToDelete(permissions?.onboardingTemplate?.isDelete);
        setOnboardingTemplateData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.onboardingTemplate);
    setResourcePolicyData(data);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.onboardingTemplate.path}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.onboardingTemplate?.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    history.replace({
      search: queryString.stringify({ tab: newValue }),
    });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[
              { ...routes?.onboardingTemplate, title: resources?.onboardingTemplate?.titlePlural },
              { title: `${onboardingTemplateData ? onboardingTemplateData?.templateName : ''}` }
            ]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
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
          {resourcePolicyData &&
            resourcePolicyData?.tabs?.length > 0 &&
            resourcePolicyData?.tabs?.map((tab, i) => (
              <CustomTab value={i + 1} key={i}>
                {tab?.tabName}
              </CustomTab>
            ))}
        </CustomTabs>
        
        <TabPanel value={tabValue} index={0}>
          {onboardingTemplateData && fields ? (
            <DetailsPage 
              data={onboardingTemplateData} 
              fields={fields} 
            />
          ) : (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          )}
        </TabPanel>
        
        {resourcePolicyData &&
          resourcePolicyData?.tabs?.length > 0 &&
          resourcePolicyData?.tabs?.map((tab, i) => (
            <TabPanel value={tabValue} index={i + 1} key={i}>
              <Step
                tab={tab}
                resourcePolicyId={resourcePolicyData?._id}
                resourceId={id}
                resource={sidebarResource.onboardingTemplate}
                data={onboardingTemplateData}
                allowedToEdit={permissions?.onboardingTemplate?.isUpdate}
              />
            </TabPanel>
          ))}
      </Box>
      
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.onboardingTemplate?.titleSingular?.toLowerCase()}: ${onboardingTemplateData?.templateName}?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
      
      {openUpdateDialog && (
        <ManageOnboardingTemplate
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

export default OnboardingTemplateDetail;
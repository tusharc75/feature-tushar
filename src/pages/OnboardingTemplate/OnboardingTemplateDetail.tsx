import { Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
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
import ManageOnboardingTemplate from 'src/pages/OnboardingTemplate/ManageOnboardingTemplate';
import DynamicTabs from 'src/components/FormBuilder/Tabs';

const OnboardingTemplateDetail = () => {

  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();

  const {
    state: { permissions, resources }
  }: any = useData();

  const [onboardingTemplateData, setOnboardingTemplateData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchFields();
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
    setLoading(true);
    try {
      const { data: { data } } = await axiosInstance().get(`${routes.onboardingTemplate.path}/${id}`);
      setAllowedToEdit(permissions?.onboardingTemplate?.isUpdate);
      setAllowedToDelete(permissions?.onboardingTemplate?.isDelete);
      setOnboardingTemplateData(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    } finally {
      setLoading(false);
    }
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
          <CustomTab value={1}>Tabs</CustomTab>
        </CustomTabs>

        <TabPanel value={tabValue} index={0}>
          {loading || !fields ? (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          ) : (
            <DetailsPage
              data={onboardingTemplateData}
              fields={fields}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <DynamicTabs
            onboardingTemplateId={id}
            resource={sidebarResource.onboardingTemplate}
          />
        </TabPanel>
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
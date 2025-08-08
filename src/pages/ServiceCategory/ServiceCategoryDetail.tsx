import { Box } from '@mui/material';
import { Edit } from '@mui/icons-material';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
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
import { serviceCategory, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import { ManageServiceCategory } from 'src/pages/ServiceCategory/ManageServiceCategory';
import { getResourcePolicy } from 'src/pages/DynamicForm/helper';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';

const ServiceCategoryDetail = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [categoryData, setCategoryData] = useState(null);
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
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource?.serviceCategory, permissions?.serviceCategory?.isUpdate);
    setFields(fieldsDataForRead);
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${serviceCategory.api}/${id}`)
      .then(({ data: { data } }) => {
        setAllowedToEdit(permissions?.serviceCategory?.isUpdate);
        setAllowedToDelete(permissions?.serviceCategory?.isDelete);
        setCategoryData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPolicy = async () => {
    const data = await getResourcePolicy(user, permissions, sidebarResource.serviceCategory);
    setResourcePolicyData(data);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceCategory.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.serviceCategory?.path}`);
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
              { ...routes?.serviceCategory, title: resources?.serviceCategory?.titlePlural },
              { title: `${categoryData ? categoryData?.name : ''}` }
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
          {resourcePolicyData &&
            resourcePolicyData?.tabs?.length > 0 &&
            resourcePolicyData?.tabs?.map((tab, i) => (
              <CustomTab value={i + 1} key={i}>
                {tab?.tabName}
              </CustomTab>
            ))}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {categoryData && fields ? <DetailsPage data={categoryData} fields={fields} /> : <CommonSkeleton lenArray={[...Array(10).keys()]} />}
        </TabPanel>
        {resourcePolicyData &&
          resourcePolicyData?.tabs?.length > 0 &&
          resourcePolicyData?.tabs?.map((tab, i) => (
            <TabPanel value={tabValue} index={i + 1} key={i}>
              <Step
                tab={tab}
                resourcePolicyId={resourcePolicyData?._id}
                resourceId={id}
                resource={sidebarResource.serviceCategory}
                data={categoryData}
                allowedToEdit={permissions?.serviceCategory?.isUpdate}
              />
            </TabPanel>
          ))}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.serviceCategory?.titleSingular?.toLowerCase()} : ${categoryData?.name} ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageServiceCategory
          isClone={false}
          serviceCategoryId={id}
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

export default ServiceCategoryDetail;

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
import { productTypes, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import { ManageProductTypes } from 'src/pages/ProductTypes/ManageProductTypes';

const ProductTypesDetail = () => {

  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { permissions, resources }
  }: any = useData();

  const [productTypeData, setproductTypeData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourceData, setResourceData] = useState(null);
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
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.productTypes}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };


  const fetchData = async () => {
    axiosInstance().get(`${productTypes.api}/${id}`).then(({ data: { data } }) => {
      setAllowedToEdit(permissions?.productTypes?.isUpdate);
      setAllowedToDelete(permissions?.productTypes?.isDelete);
      setproductTypeData(data);
    }).catch((err) => {
      toastConfig.setToastConfig(err);
    });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.productTypes}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${productTypes.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes?.productTypes?.path}`);
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
              { ...routes?.productTypes, title: resources?.productTypes?.titlePlural },
              { title: `${productTypeData ? productTypeData?.productType : ''}` }
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
          {resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 1} key={i}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {productTypeData && fields ? (
            <DetailsPage data={productTypeData} fields={fields} />
          ) : (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          )}
        </TabPanel>
        {resourceData?.tabs?.map((tab, i) => (
          <TabPanel value={tabValue} index={i + 1} key={i}>
            <Step tab={tab} resourcePolicyId={resourceData?._id} resourceId={id} resource={sidebarResource.productTypes} data={productTypeData} allowedToEdit={permissions?.productTypes?.isUpdate} />
          </TabPanel>
        ))}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.productTypes?.titleSingular?.toLowerCase()} : ${productTypeData?.productType} ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDelete} />
      )}
      {openUpdateDialog && (
        <ManageProductTypes
          isClone={false}
          productTypesId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false)
            fetchData()
          }} />
      )}
    </Box>
  );
};

export default ProductTypesDetail;
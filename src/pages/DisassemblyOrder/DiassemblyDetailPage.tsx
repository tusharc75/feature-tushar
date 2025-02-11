import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Edit } from '@mui/icons-material';
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
import { disassemblyOrder, sidebarResource } from '../../constants/helpers';
import Step from '../DynamicForm/Step';
import { ManageDiassemblyOrder } from "src/pages/DisassemblyOrder/ManageDiassemblyOrder";

const DisassemblyOrderDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [loadingDetails, setLoadingDetails] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [fields, setFields] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
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
    setLoadingDetails(true);
    axiosInstance()
      .get(`${disassemblyOrder.api}/${id}`)
      .then(({ data: { data } }) => {
        setLoadingDetails(false);
        setAllowedToEdit(permissions?.disassemblyOrder?.isUpdate);
        setAllowedToDelete(permissions?.disassemblyOrder?.isDelete);
        setOrderData(data);
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
              { title: `${orderData ? orderData?.disassemblyOrderNumber : ''}` }
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
          {!loadingDetails && orderData && fields ? (
            <DetailsPage data={orderData} fields={fields} />
          ) : (
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          )}
        </TabPanel>
        {resourceData?.tabs?.map((tab, i) => (
          <TabPanel value={tabValue} index={i + 1} key={i}>
            <Step tab={tab} resourcePolicyId={resourceData?._id} resourceId={id} resource={sidebarResource.disassemblyOrder} data={orderData} allowedToEdit={permissions?.disassemblyOrder?.isUpdate} />
          </TabPanel>
        ))}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog open={showConfirmBox} message={`Are you sure you want to delete this order?`} onClose={() => setShowConfirmBox(false)} onOk={handleDelete} />
      )}
      {openUpdateDialog && (
        <ManageDiassemblyOrder isClone={false} disassemblyOrderId={id} onClose={() => setOpenUpdateDialog(false)} onSuccess={fetchData} />
      )}
    </Box>
  );
};

export default DisassemblyOrderDetailsPage;
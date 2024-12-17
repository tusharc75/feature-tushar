import { Box, Button, Grid, Menu, MenuItem } from '@material-ui/core';
import { Edit, ExpandMore } from '@material-ui/icons';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  DEMAND_ORDER_STATUS,
  MATERIAL_TYPE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  demandOrder,
  sidebarResource
} from '../../constants/helpers';
import ManageProductionOrder from '../ProductionOrder/ManageProductionOrder';
import ManagePurchaseOrder from '../PurchaseOrder/ManagePurchaseOrder';
import ManageDemandOrderDialog from './ManageDemandOrderDialog';
import Step from '../DynamicForm/Step';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Material from './Material';
import { useTableReducer } from 'src/components/CustomReactTable';

const DemandOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const { isOffline } = useContext(CustomOfflineContext);
  const [resourceData, setResourceData] = useState(null);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [loading, setLoading] = useState(false);
  const [demandOrderData, setDemandOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [convertAnchorEl, setConvertAnchorEl] = useState(null);
  const [convertDialog, setConvertDialog] = useState({ open: false, type: '' });

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
    try {
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource.demandOrder}`);
      setFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let data;
      const response: any = await axiosInstance().get(`${demandOrder.api}/${id}`);
      data = response?.data?.data;
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.demandOrder, data));
      setAllowedToDelete(permissions?.demandOrder?.isDelete && checkIsAllowedToDelete(user, sidebarResource.demandOrder, data.owner.optionValue));
      setDemandOrderData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.demandOrder}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${demandOrder.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${routes.demandOrder.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const closeConvertMenu = () => {
    setConvertAnchorEl(null);
  };

  const handleConvertSuccess = (data: any) => {
    const value = {
      _id: id,
      status: DEMAND_ORDER_STATUS.converted
    };
    if (convertDialog.type === sidebarResource.purchaseOrder) {
      value['purchaseOrder'] = data?._id;
    } else {
      value['productionOrder'] = data?._id;
    }
    axiosInstance()
      .put(`${routes?.demandOrder?.path}/update-converted`, value)
      .then(({ data }) => {
        fetchData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Converted Successfully`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        fetchData();
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.demandOrder, title: resources?.demandOrder?.titlePlural }, { title: `${demandOrderData?.demandOrderNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {demandOrderData?.status !== DEMAND_ORDER_STATUS.converted && (
              <>
                {demandOrderData?.material?.length > 0 && (
                  <Button
                    variant={'contained'}
                    className="btn-outline-v1"
                    size="small"
                    onClick={(e) => {
                      setConvertAnchorEl(e.currentTarget);
                    }}
                    aria-controls="convert-menu"
                    endIcon={<ExpandMore fontSize="small" />}
                  >
                    {'Convert'}
                  </Button>
                )}
                <Menu
                  anchorEl={convertAnchorEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="convert-menu"
                  open={Boolean(convertAnchorEl)}
                  onClose={closeConvertMenu}
                >
                  <MenuItem
                    onClick={() => {
                      closeConvertMenu();
                      setConvertDialog({ open: true, type: sidebarResource.purchaseOrder });
                    }}
                  >
                    {resources?.purchaseOrder?.titleSingular}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      closeConvertMenu();
                      setConvertDialog({ open: true, type: sidebarResource.productionOrder });
                    }}
                  >
                    {resources?.productionOrder?.titleSingular}
                  </MenuItem>
                </Menu>
                {permissions?.demandOrder?.isUpdate && allowedToEdit && (
                  <Button
                    className="btn-outline-v1"
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                  >
                    {isMobile && !isTablet ? <Edit /> : 'Edit'}
                  </Button>
                )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            )}
            <ActivityButton
              referenceId={demandOrderData?._id}
              resource={ACTIVITY_RESOURCE.demandOrder}
              resourceLabel={demandOrderData?.demandOrderNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Header
          </CustomTab>
          <CustomTab value={1}>
            Details
          </CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={demandOrderData} fields={fields} />
              </>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {demandOrderData && (
            <Material
              demandOrderData={demandOrderData}
              fetchDemadOrderData={fetchData}
              allowedToEdit={
                allowedToEdit && permissions?.demandOrder?.isUpdate && demandOrderData?.status !== DEMAND_ORDER_STATUS.converted ? true : false
              }
              resources={resources}
            />
          )}
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
                  resource={sidebarResource.demandOrder}
                  data={demandOrderData}
                  allowedToEdit={permissions?.demandOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.demandOrder?.titleSingular?.toLowerCase()} :
            ${demandOrderData?.demandOrderNumber || ''}` : `selected ${resources?.demandOrder?.titlePlural?.toLowerCase()}`} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={() => {
            handleDelete();
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageDemandOrderDialog
          isClone={false}
          open={openUpdateDialog}
          demandOrderId={id}
          demandOrderData={demandOrderData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {convertDialog.open && convertDialog.type === sidebarResource.purchaseOrder && (
        <ManagePurchaseOrder
          isClone={false}
          purchaseOrderId={null}
          onClose={() => setConvertDialog({ open: false, type: '' })}
          onSuccess={(data: any) => {
            handleConvertSuccess(data);
          }}
          products={demandOrderData?.material
            ?.filter((item: any) => item?.type == MATERIAL_TYPE.product)
            ?.map((e) => {
              return { ...e, product: e.materialId };
            })}
          services={demandOrderData?.material
            ?.filter((item: any) => item?.type == MATERIAL_TYPE.service)
            ?.map((e) => {
              return { ...e, service: e.materialId };
            })}
          warehouseId={demandOrderData?.warehouse?.optionValue}
        />
      )}
      {convertDialog.open && convertDialog.type === sidebarResource.productionOrder && (
        <ManageProductionOrder
          isClone={false}
          productionOrderId={null}
          onClose={() => setConvertDialog({ open: false, type: '' })}
          onSuccess={(data) => {
            handleConvertSuccess(data);
          }}
          referenceData={{ warehouse: demandOrderData?.warehouse?.optionValue }}
        />
      )}
    </Box>
  );
};

export default DemandOrderDetails;

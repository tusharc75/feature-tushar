import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BiFoodMenu } from 'react-icons/bi';
import { FaWpforms } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import TabPanel from '../../components/TabPanel';
import { ACTIVITY_RESOURCE, checkSuperAdminAccess, demandOrder, sidebarResource } from '../../constants/helpers';
import ManageDemandOrderDialog from './ManageDemandOrderDialog';
import Material from './Material';

const DemandOrderDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.demandOrder.title);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const [loading, setLoading] = useState(false);
  const [demandOrderData, setDemandOrderData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Demand Order');
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
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (checkSuperAdminAccess(user, sidebarResource.demandOrder)) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      setDemandOrderData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.demandOrder, { title: `${demandOrderData?.demandOrderNumber}` }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {demandOrderData ? (
              <>
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

                {permissions?.demandOrder?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
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
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              display: 'none'
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
              </div>
            }
            {...a11yProps(0)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            {...a11yProps(1)}
          />
        </Tabs>
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
              renderedFrom={`${renderedFrom}_grid-1`}
              allowedToEdit={allowedToEdit && permissions?.demandOrder?.isUpdate ? true : false}
            />
          )}
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this demand order: ${demandOrderData?.demandOrderNumber} ?`}
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
    </Box>
  );
};

export default DemandOrderDetails;

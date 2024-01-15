import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import TabPanel from '../../components/TabPanel';
import { camelCase } from 'lodash';
import { FaWpforms } from 'react-icons/fa';
import { sidebarResource } from 'src/constants/helpers';
import ManagePayrollPolicy from './ManagePayrollPolicy';
import Holidays from './Holidays';
import PayTypes from './PayTypes';

const PayrollPolicyDetail = () => {
  const renderedFrom = camelCase(routes?.payrollPolicy.title);

  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [payrollPolicyData, setPayrollPolicyData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.payrollPolicy}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.payrollPolicy.path}/${id}`);
      //   var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      var isAllowedToEdit = true;
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
      //   setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setAllowedToDelete(true);
      setPayrollPolicyData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.payrollPolicy?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.payrollPolicy.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.payrollPolicy, { title: payrollPolicyData?.payrollPolicyName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.payrollPolicy?.isUpdate && allowedToEdit && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {permissions?.payrollPolicy?.isDelete && allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              {/* <ActivityButton
                referenceId={planningData?._id}
                resource={ACTIVITY_RESOURCE.payrollPolicy}
                resourceLabel={planningData?.planningNumber}
              /> */}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              height: 0
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
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Holidays
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Pay Types
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={payrollPolicyData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <PayTypes payrollPolicyId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Holidays payrollPolicyData={payrollPolicyData} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.payrollPolicy?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManagePayrollPolicy
          isClone={false}
          id={id}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default PayrollPolicyDetail;

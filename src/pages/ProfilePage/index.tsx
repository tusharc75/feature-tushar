import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Paper, Theme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ProfileSidebar from './components/ProfileSidebar';
import { profileMenuItems, sidebarResource } from '../../constants/helpers';
import ManageProfile from './components/ManageProfile';
import NotificationPreference from './components/NotificationPreference';
import UiPreference from './components/UiPreference';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CustomContainer from '../../components/CustomContainer';
import { useData } from '../../StateProvider/Provider';
import { SET_USER } from 'src/StateProvider/actionTypes';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import MyProfile from 'src/pages/ProfilePage/components/MyProfile';
import SecurityLogin from 'src/pages/ProfilePage/components/SecurityLogin';
import ProxiesDelegations from 'src/pages/ProfilePage/components/ProxiesDelegations';

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    marginBottom: theme.spacing(1)
  },
  profileContainer: {
    width: '90%',
    margin: theme.spacing(4),
    borderRadius: '8px',
    textAlign: 'center',
    backgroundColor: theme.palette.common.white
  },
  profileSidebar: {
    position: 'fixed',
    width: '23%',
    height: 'calc(100vh - 142px)',
    background: '#ececec !important',
    borderRadius: '6px'
    // borderRight: `2px solid ${theme.palette.primary.light}`
  }
}));
export default function ProfilePage(props) {
  const {
    state: { user, permissions },
    dispatch
  }: any = useData();
  const { profileBreadCrumbs } = props;
  const [activeItem, setActiveItem] = useState(profileMenuItems.profile);
  const [userData, setUserData] = useState(null);
  const [proxyBy, setProxyBy] = useState([]);
  const [otherDetails, setOtherDetails] = useState(null);
  const [notificationPreferenceData, setNotificationPreferenceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userFields, setUserFields] = useState([]);
  const classes = useStyles();
  const toastConfig = useContext(CustomToastContext);
  const [tabValue, setTabValue] = useState(0);

  const handleItemClick = (obj) => {
    if (obj.id) setActiveItem(obj.id);
  };

  useEffect(() => {
    if (userFields.length === 0) {
      getUserFields();
      fetchUserData();
      getLoggedInUserData();
    }
  }, []);

  const fetchUserData = (dispatchData = false) => {
    setUserLoading(true);
    axiosInstance()
      .get(`/user/me`)
      .then(({ data: { data } }) => {
        if (dispatchData) {
          dispatch({ type: SET_USER, payload: data });
        }
        if (data?.user) {
          setOtherDetails({
            Email: data.user.email ?? '',
            EmployeeNumber: data.user?.employeeNumber ?? ''
          });
          let { blocked, updatedBy, employeeNumber, ...userData } = data.user;
          setUserData(userData);
          setNotificationPreferenceData(data.user.notificationPref);
        }
        if (data?.proxyBy) {
          setProxyBy(data.proxyBy);
        }
        setUserLoading(false);
      })
      .catch((error) => {
        setUserLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const getUserFields = async () => {
    let data;
    setLoading(true);
    const { fieldsDataForRead } = await fetch_resource_view_fields(sidebarResource.user, permissions?.user?.isUpdate);
    data =
      fieldsDataForRead && fieldsDataForRead.length
        ? fieldsDataForRead.filter((field) => ['blocked', 'email', 'employeeNumber'].indexOf(field?.fieldData?.fieldName) < 0)
        : [];
    setUserFields(data);
    setLoading(false);
  };

  const getLoggedInUserData = async () => {
    axiosInstance()
      .get(`user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        if (data?.quotePDFTemplate) {
          setUserData((prevState) => ({ ...prevState, quotePDFTemplate: data?.quotePDFTemplate }));
        }
      });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid size={{ md: 12, sm: 12, xs: 12 }}>
          <CustomBreadCrumbs routes={[profileBreadCrumbs]} />
        </Grid>
      </Grid>

      {/* <CustomContainer> */}
      <Box p={{ xs: 0, md: 2 }}>
        <Box className={`detail-container-v1`}>
          <CustomTabs value={tabValue} onChange={handleTabChange}>
            <CustomTab value={0}>My Profile</CustomTab>
            <CustomTab value={1}>Security & Login</CustomTab>
            <CustomTab value={2}>Proxies & Delegations</CustomTab>
            <CustomTab value={3}>Notification Preferences</CustomTab>
            <CustomTab value={4}>UI Preferences</CustomTab>
          </CustomTabs>
          <TabPanel value={tabValue} index={0}>
            <MyProfile handleItemClick={handleItemClick} activeItem={activeItem} userData={userData} onFetchUserData={fetchUserData} otherDetails={otherDetails} proxyBy={proxyBy} userFields={userFields} loading={loading} userLoading={userLoading} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <SecurityLogin userData={userData} dispatch={dispatch} onFetchUserData={fetchUserData} toastConfig={toastConfig} permissions={permissions} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <ProxiesDelegations userData={userData} userProxy={proxyBy} onFetchUserData={fetchUserData} />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <NotificationPreference notificationPreferenceData={notificationPreferenceData} user={userData?._id} onSuccess={fetchUserData} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <UiPreference
              userData={userData}
              onSuccess={() => {
                fetchUserData(true);
              }}
            />
          </TabPanel>
        </Box>
      </Box>

    </Fragment>
  );
}

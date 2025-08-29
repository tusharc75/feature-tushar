import { useState, useEffect, useContext } from 'react';
import { Box } from '@mui/material';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { sidebarResource } from '../../constants/helpers';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_USER } from 'src/StateProvider/actionTypes';
import { fetch_resource_view_fields } from 'src/components/ResourceFields';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import MyProfile from 'src/pages/ProfilePage/MyProfile';
import SecurityLogin from 'src/pages/ProfilePage/SecurityLogin';
import ProxiesDelegations from 'src/pages/ProfilePage/ProxiesDelegations';
import NotificationPreference from 'src/pages/ProfilePage/NotificationPreferences';
import UiPreference from 'src/pages/ProfilePage/UIPreferences';

export default function ProfilePage(props) {
  const {
    state: { user, permissions },
    dispatch
  }: any = useData();
  const { profileBreadCrumbs } = props;
  const [userData, setUserData] = useState(null);
  const [proxyBy, setProxyBy] = useState([]);
  const [otherDetails, setOtherDetails] = useState(null);
  const [notificationPreferenceData, setNotificationPreferenceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userFields, setUserFields] = useState([]);
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const [locationKeys, setLocationKeys] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 0);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 0);
        }
      }
    });
  }, [locationKeys]);

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

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    if (newValue === 0) {
      fetchUserData();
    }
    history.push(`?tab=${newValue}`);
  };

  return (<Box className="main-container-v1">
    <Box className="headerbox-v1">
      <Box className="nav-v1">
        <CustomBreadCrumbs routes={[profileBreadCrumbs]} />
      </Box>
    </Box>
    <Box className={`detail-container-v1`}>
      <CustomTabs value={tabValue} onChange={handleTabChange}>
        <CustomTab value={0}>My Profile</CustomTab>
        <CustomTab value={1}>Security & Login</CustomTab>
        <CustomTab value={2}>Proxies & Delegations</CustomTab>
        <CustomTab value={3}>Notification Preferences</CustomTab>
        <CustomTab value={4}>UI Preferences</CustomTab>
      </CustomTabs>
      <TabPanel value={tabValue} index={0}>
        <MyProfile
          userData={userData}
          onFetchUserData={fetchUserData}
          otherDetails={otherDetails}
          proxyBy={proxyBy}
          userFields={userFields}
          loading={loading}
          userLoading={userLoading}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <SecurityLogin
          user={user}
          userData={userData}
          dispatch={dispatch}
          onFetchUserData={fetchUserData}
          toastConfig={toastConfig}
          permissions={permissions}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <ProxiesDelegations
          userData={userData}
          userProxy={proxyBy}
          onFetchUserData={fetchUserData}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <NotificationPreference />
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
  );
}

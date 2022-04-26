import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Grid,
  Box,
  Button,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  IconButton,
  Paper,
  Tooltip,
  Tabs,
  Tab,
  TableRow,
  TableContainer,
  TableHead,
  Table,
  TableBody,
  TableCell,
  makeStyles,
  Dialog,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery
} from '@material-ui/core';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { ControlPoint } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory, useLocation, Link } from 'react-router-dom';
import { startCase } from 'lodash';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import BoxWithBorder from '../../components/BoxWithBorder';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import AssignRolesDialog from '../../components/AssignRolesDialog/AssignRolesDialog';
import {
  displayDate,
  userType,
  defaultActivityShow,
  dateFormatForInputControl,
  opportunity,
  lead,
  customerAccount,
  supplierAccount,
  customerContact,
  supplierContact,
  quoteBuilder
} from '../../constants/helpers';
import OpportunityAccordionInUserDetail from './OpportunityAccordionInUserDetail';
import LeadAccordionInUserDetailPage from './LeadAccordionInUserDetailPage';
import AccountAccordionDetail from './AccountAccordionInDetail';
import ContactAccordionInDetailPage from './ContactAccordionInDetailPage';
import ManageUserDialog from './ManageUserDialog';
import OrgChartContainer from '../../components/OrgChart/OrgChartContainer';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import { FcFlowChart } from 'react-icons/fc';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import AssignedEntities from './AssignedEntities';
import { isMobile, isTablet } from 'react-device-detect';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import UserSetupDialog from './UserSetupDialog';
import moment from 'moment';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { Line } from 'react-chartjs-2';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import accountClass from '../Account/account.module.scss';
import { BiReset } from 'react-icons/all';
import { BiEdit } from 'react-icons/bi';
import { MdDelete } from 'react-icons/md';
import QuotesInAccordion from 'src/components/QuotesInAccordion/QuotesInAccordion';

const useStyles = makeStyles((theme) => ({
  dataValue: {
    fontWeight: 500,
    color: theme.palette.primary.main
  },
  detailLabel: {
    fontSize: '0.8rem',
    fontWeight: 'normal',
    color: '#656464'
  }
}));

const UserDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const queryParameter = useLocation().search;
  const userSetup = new URLSearchParams(queryParameter).get('userSetup');
  const {
    state: { user, permissions }
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalRoles, setGloabalRoles] = useState([]);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [rolesLoading] = useState(false);
  // const [userRelatedLoading, setUserRelatedLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [leadsRelatedData, setLeadsRelatedData] = useState(null);
  const [opportunityRelatedData, setOpportunityRelatedData] = useState(null);
  const [customerContactRelatedData, setCustomerContactRelatedData] = useState(null);
  const [customerAccountRelatedData, setCustomerAccountRelatedData] = useState(null);
  const [supplierAccountRelatedData, setSupplierAccountRelatedData] = useState(null);
  const [supplierContactRelatedData, setSupplierContactRelatedData] = useState(null);
  const [quotesRelatedData, setQuotesRelatedData] = useState(null)
  const [userPermissions, setUserPermissions] = useState(null);
  const [unionRoleData, setUnionRoleData] = useState(null);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  // const [isChangingPermission, setIsChangingPermission] = useState(false);
  const [hasPermissionToUpdateApprovalProcess] = useState(permissions?.user?.isUpdate && user?.user?.userType === userType.brandAdmin);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleteUserRec, setDeleteUserRec] = useState(undefined);
  const [roleDeleteRec, setRoleDeleteRec] = useState(undefined);
  const [userFields, setUserFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  // const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.user]);
  const [userList, setUserList] = useState<any[]>([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [orgChartData, setOrgChartData] = useState([]);
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
  const [entities, setEntities] = useState<any[]>([]);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [showSetupUserDialog, setShowSetupUserDialog] = useState(false);
  const [timeFrame, setTimeFrame] = useState<any>('1-year');
  const [trackingTime, setTrackingTime] = useState({
    between: {
      from: new Date(moment().subtract(1, 'year').calendar()),
      to: new Date()
    }
  });
  const [userTrackingData, setUserTrackingData] = useState({
    labels: [],
    datasets: []
  });
  const [userTrackingDataLoading, setUserTrackingDataLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    if (id) {
      getUserFields();
      fetchUserData();
      getRoleUnion();
      fetchUsers();
      fetchUserRelatedDetail();
      setCurrentTabIndex(0);
    }
    userSetup === 'true' && setShowSetupUserDialog(true);
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true);
    }
  }, [isSmallScreen]);

  useEffect(() => {
    fetchAllUsers();
    fetchLoggedInUserEntities();
    fetchLoggedInUserRole();
  }, []);

  useEffect(() => {
    switch (timeFrame) {
      case '1-month':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('1', 'month').calendar()),
            to: new Date()
          }
        });
        break;

      case '3-months':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('3', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '6-months':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('6', 'months').calendar()),
            to: new Date()
          }
        });
        break;

      case '1-year':
        setTrackingTime({
          between: {
            from: new Date(moment().subtract('1', 'year').calendar()),
            to: new Date()
          }
        });
        break;
      default:
        break;
    }
  }, [timeFrame]);

  useEffect(() => {
    userTimeTracker();
  }, [trackingTime]);

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance()
      .get(`/user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        data.entities.map((item) => {
          item.role.forEach((role) => {
            if (roleIds.includes(role?._id)) {
            } else {
              roleIds.push(role?._id);
            }
          });
        });
        setRoleAccessOfLoggedInUser(roleIds);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const fetchAllUsers = () => {
    axiosInstance()
      .get(`/user`)
      .then(({ data: { data, count } }) => {
        let tempAllUsers = data.map((o) => ({ optionValue: o?._id, optionLabel: o?.concatedName }));
        setAllUsers(tempAllUsers);
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: 'Org Chart',
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      show: true,
      class: 'account'
    }
  ].filter((d) => d.show);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity);
  };

  const fetchUserData = async () => {
    setLoading(true);

    await axiosInstance()
      .get(`/user/${id}`)
      .then(({ data: { data } }) => {
        handleMainPoints(data);
        const name = [data.firstName, data.lastName].filter((d) => d).join(' ');

        setHeadingLbl(name);
        setUserData(data);
        setEntities(data.entities.filter((e) => e.role.length !== 0 || e.entity !== undefined));
        setGloabalRoles(data.role);
        setCustomizedRoutes([routes.user, { title: `${data.firstName} ${data.lastName}` }]);

        let orgChartData = [];

        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.forEach((d) => {
            orgChartData.push({
              id: d._id,
              name: [d.firstName, d.lastName].filter((d) => d).join(' '),
              parentId: d.reportsTo ? d.reportsTo : 0,
              logo: d.avatar,
              email: d.email,
              phone: d.mobileNo,
              current: false
            });
          });
        }

        orgChartData.push({
          id: data._id,
          name: [data.firstName, data.lastName].filter((d) => d).join(' '),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          logo: data.avatar,
          email: data.email,
          phone: data.mobileNo,
          current: true
        });

        setOrgChartData(orgChartData);

        setUserPermissions(data?.permissions);
        setLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const convertDate = (str) => {
    let date = new Date(str),
      month = ('0' + (date.getMonth() + 1)).slice(-2),
      day = ('0' + date.getDate()).slice(-2);
    return [month, day, date.getFullYear()].join('-');
  };

  const userTimeTracker = async () => {
    setUserTrackingDataLoading(true);
    const parsedFromTime = convertDate(trackingTime.between.from);
    const parsedToTime = convertDate(trackingTime.between.to);
    const { from, to } = trackingTime.between

    const hour = 1000 * 60 * 60;
    const day = 1000 * 60 * 60 * 24;
    // const month = 1000 * 60 * 60 * 24 * 30
    // const year = 1000 * 60 * 60 * 24 * 30 * 12
    const dateDiff = moment(to).diff(from, 'days');
    const time = dateDiff > 90 ? day : hour;
    axiosInstance()
      .get(`/user-activity/${id}/${parsedFromTime}/${parsedToTime}`)
      .then(({ data: { data } }) => {
        const labels = [];
        const dataSets = [];

        data = data.sort((a, b) => {
          const aDate = new Date(a.date).getTime();
          const bDate = new Date(b.date).getTime();

          return aDate - bDate;
        });



        data.forEach((obj) => {
          labels.push(moment(obj?.date).format('DD/MMM'));
          dataSets.push(Math.ceil(obj?.totalDuration / time));
        });
        setUserTrackingData({
          labels: labels,
          datasets: [
            {
              label: `Total Duration (${dateDiff > 90 ? "In Days" : "In Hours"})`,
              data: dataSets,
              borderColor: 'rgba(75,192,192,1)'
            }
          ]
        });
        setUserTrackingDataLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchUsers = () => {
    axiosInstance()
      .get('/user')
      .then(({ data: { data, count } }) => {
        getRows(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`
      }))
      : [];

    setUserList(rows);
  };

  const fetchUserRelatedDetail = () => {
    // setUserRelatedLoading(true);
    axiosInstance()
      .get(`/user/related/${id}`)
      .then(({ data: { data } }) => {
        setCustomerAccountRelatedData(data['Customer Account']);
        setCustomerContactRelatedData(data['Customer Contact']);
        setSupplierAccountRelatedData(data['Supplier Account']);
        setSupplierContactRelatedData(data['Supplier Contact']);
        setLeadsRelatedData(data['Lead']);
        setOpportunityRelatedData(data['Opportunity']);
        setQuotesRelatedData(data['Quotes']);
      })
      .catch((error) => {
        // setUserRelatedLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data.firstName} ${data.lastName}`,
      phone: data.mobileNo || '',
      email: data.email || ''
    };
    setMainPoints(tempMp);
  };

  const getUserFields = () => {
    axiosInstance()
      .get('/field?resource=User')
      .then(({ data }) => {
        setUserFIelds(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteUser = (id) => {
    setDeleteUserRec(id);
    setShowConfirmBox(true);
  };

  const DeleteUser = () => {
    if (deleteUserRec) {
      if (permissions?.user?.isDelete) {
        axiosInstance()
          .put(`/user/remove`, { ids: [deleteUserRec] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            history.goBack();
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  // const handleUpdateUser = (values) => {
  //   setUpdating(true);

  //   axiosInstance()
  //     .put(`/user`, { ...values, _id: id })
  //     .then(({ data }) => {
  //       fetchUserData();
  //       toastConfig.setToastConfig({
  //         open: true,
  //         type: "success",
  //         message: data.message,
  //       });
  //       setUserPermissions(data.permissions);
  //       setUpdating(false);
  //       closeUpdateDialog();
  //     })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //       setUpdating(false);
  //     });
  // };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const entityDialogOpen = () => {
    setShowAssignEntityDialog(true);
  };

  const entityDialogClose = () => {
    setShowAssignEntityDialog(false);
  };

  const getRoleUnion = () => {
    axiosInstance()
      .get(`/user/union-role/${id}`)
      .then(({ data: { data } }) => {
        setUnionRoleData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  /* Unassign role */
  const handleUnassignRole = (rec) => {
    setRoleDeleteRec(rec);
    setShowConfirmBox(true);
  };

  const unassignUserRole = () => {
    if (roleDeleteRec?._id) {
      const data = {
        user: id,
        roles: [roleDeleteRec?._id]
      };
      axiosInstance()
        .put('/user/un-assign-role', data)
        .then(() => {
          setShowConfirmBox(false);
          fetchUserData();
          setUnionRoleData(null);
          getRoleUnion();
          toastConfig.setToastConfig({
            message: 'Role unassigned successfully',
            type: 'success',
            open: true
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };
  /**
   *  Permissions Change Handle
   */
  const handleChangePermissions = (e) => {
    setUserPermissions({
      ...userPermissions,
      [e.target.name]: e.target.checked
    });
    const newData = {
      _id: id,
      ...userPermissions,
      [e.target.name]: e.target.checked
    };
    // setHasPermissionToUpdateApprovalProcess(false);
    axiosInstance()
      .put('/user/permission-setup', newData)
      .then(({ data }) => {
        // setHasPermissionToUpdateApprovalProcess(permissions.user.isUpdate && user?.user?.userType === userType.brandAdmin);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        // setHasPermissionToUpdateApprovalProcess(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenDialog = () => {
    setRolesDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRolesDialogOpen(false);
  };

  const handleResetPassword = async () => {
    axiosInstance()
      .post(`/user/forget-password`, {
        email: userData.email
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          message: data.message,
          type: 'success',
          open: true
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const isLoggedInUserBrandAdmin = 'userType' in user?.user && user?.user?.userType === userType.brandAdmin;
  return (
    <>
      {openUpdateDialog && (
        <ManageUserDialog
          open={openUpdateDialog}
          close={closeUpdateDialog}
          onSuccess={(obj) => {
            setUserPermissions(obj?.permissions);
            setOpenUpdateDialog(false);
            fetchUserData();
          }}
          userId={userData._id}
          dataToUpdate={userData}
          isNew={false}
        />
      )}
      {rolesDialogOpen && (
        <Dialog fullWidth maxWidth="xs" open={rolesDialogOpen} onClose={handleCloseDialog} aria-labelledby="assign-roles-dialog">
          <AssignRolesDialog
            rolesDialogOpen={rolesDialogOpen}
            handleCloseDialog={handleCloseDialog}
            userIds={[id]}
            assignedRoles={globalRoles}
            onSuccess={() => {
              handleCloseDialog();
              fetchUserData();
              getRoleUnion();
            }}
          />
        </Dialog>
      )}
      {showAssignEntityDialog && (
        <Dialog fullWidth maxWidth="xs" open={showAssignEntityDialog} onClose={entityDialogClose} aria-labelledby="assign-roles-dialog">
          <AssignEntityDialog
            entitiesDialogOpen={showAssignEntityDialog}
            handleCloseDialog={entityDialogClose}
            type="entity"
            ids={[id]}
            assignedEntity={entities}
            regionalRole={false}
            onSuccess={() => {
              fetchUserData();
              entityDialogClose();
            }}
            roleAccessIds={roleAccessOfLoggedInUser}
          />
        </Dialog>
      )}
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity-user' : 'grid-without-activity-user'}`}>
          <div>
            <Paper>
              {!userData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={headingLbl}
                  logo={userData?.avatar ? userData.avatar : undefined}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions?.role?.isUpdate && permissions?.entity?.isUpdate && (
                    <Button variant="contained" color="primary" size="small" onClick={entityDialogOpen}>
                      Assign Entity/Role
                    </Button>
                  )}
                  {permissions?.user?.isUpdate && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={handleResetPassword}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                      style={isMobile && !isTablet ? { color: 'var(--warning-darken)' } : {}}
                    >
                      {isMobile && !isTablet ? <BiReset size={20} /> : 'Reset Password'}
                    </Button>
                  )}
                  {permissions?.user?.isUpdate ? (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                      disabled={!isLoggedInUserBrandAdmin && userData?.userType}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                      style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  ) : null}
                  {permissions?.user?.isDelete ? (
                    <DeleteButton
                      text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'}
                      disabled={user?.user?._id === id || userData?.userType === userType.brandAdmin}
                      onClick={() => handleDeleteUser(true)}
                      className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                    />
                  ) : null}
                </DetailsPageHeader>
              )}

              <Box style={{ padding: '8px', minHeight: '450px' }}>
                {loading || !userFields.length || !userData ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <Tabs
                      className="oms-tab"
                      value={currentTabIndex}
                      onChange={(index, newValue) => {
                        setCurrentTabIndex(newValue);
                      }}
                      indicatorColor="primary"
                      textColor="primary"
                      aria-label="icon tabs example"
                    >
                      <Tab label="Details" aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                      <Tab label="Org Chart" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
                      {userData?.proxyDOA?.optionValue && <Tab label="DOA Proxy" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />}
                      <Tab label="User Session" aria-controls="a11y-tabpanel-2" id="a11y-tab-2" />
                      <Tab label="Assigned Entity" aria-controls="a11y-tabpanel-3" id="a11y-tab-3" />
                    </Tabs>
                    <Box hidden={currentTabIndex !== 0}>
                      <DetailsPage data={userData} fields={userFields} />
                    </Box>

                    <Box hidden={currentTabIndex !== 1}>
                      <OrgChartContainer
                        data={orgChartData}
                        onClick={(id) => {
                          history.push(`${routes.userDetail.path}/${id}`);
                        }}
                      />
                    </Box>

                    {userData?.proxyDOA && (
                      <Box hidden={currentTabIndex !== 2}>
                        {/* <div className="detail-box"> */}
                        {/* <h3 className="form-label-style" title="DOA Proxy">
                            DOA Proxy
                          </h3> */}

                        <TableContainer>
                          <Table aria-label="DOA Proxy Table" size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  <h4 title="assignedTo" className={classes.detailLabel}>
                                    Assigned To
                                  </h4>
                                </TableCell>

                                <TableCell align="center">
                                  <h4 title="startDate" className={classes.detailLabel}>
                                    Start Date
                                  </h4>
                                </TableCell>

                                <TableCell align="center">
                                  <h4 title="endDate" className={classes.detailLabel}>
                                    End Date
                                  </h4>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow key={userData.proxyDOA.user}>
                                <TableCell>
                                  <Link className="link" to={`${routes.userDetail.path}/${userData.proxyDOA.optionValue}`}>
                                    {userData.proxyDOA.optionLabel}
                                  </Link>
                                </TableCell>
                                <TableCell align="center">
                                  <span className={classes.dataValue}>{displayDate(userData.proxyDOA.startDate)}</span>
                                </TableCell>
                                <TableCell align="center">
                                  <span className={classes.dataValue}>{displayDate(userData.proxyDOA.endDate)}</span>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        {/* </div> */}
                      </Box>
                    )}
                    <Box hidden={userData?.proxyDOA ? currentTabIndex !== 3 : currentTabIndex !== 2}>
                      <Box width="100%" padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between">
                        <Grid container>
                          <Grid item xs={8}>
                            <Box display="flex">
                              <Box padding="5px">
                                <Typography variant="subtitle2">User Time Track</Typography>
                              </Box>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                      <Box padding="10px">
                        <Grid item xs={12} sm={12} md={12}>
                          <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small" variant="outlined">
                                  <InputLabel id="duration">Select Duration</InputLabel>
                                  <Select labelId="duration" id="time-duration" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                                    <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                                    <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                                    <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                                    <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                                    <MenuItem value={'custom'}>Custom</MenuItem>
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={6} sm={4}>
                                <KeyboardDatePicker
                                  disabled={timeFrame !== 'custom'}
                                  inputVariant="outlined"
                                  variant="inline"
                                  fullWidth
                                  autoOk
                                  disableFuture
                                  size="small"
                                  openTo="year"
                                  format={dateFormatForInputControl}
                                  maxDate={trackingTime.between.to}
                                  label="From"
                                  views={['year', 'month', 'date']}
                                  value={trackingTime.between.from}
                                  onChange={(date) => {
                                    setTrackingTime({ between: { from: date, to: trackingTime.between.to } });
                                  }}
                                />
                              </Grid>
                              <Grid item xs={6} sm={4}>
                                <KeyboardDatePicker
                                  disabled={timeFrame !== 'custom'}
                                  inputVariant="outlined"
                                  variant="inline"
                                  fullWidth
                                  autoOk
                                  disableFuture
                                  size="small"
                                  minDate={trackingTime.between.from}
                                  openTo="year"
                                  format={dateFormatForInputControl}
                                  label="To"
                                  views={['year', 'month', 'date']}
                                  value={trackingTime.between.to}
                                  onChange={(date) => {
                                    setTrackingTime({ between: { to: date, from: trackingTime.between.from } });
                                  }}
                                />
                              </Grid>
                            </Grid>
                          </MuiPickersUtilsProvider>
                        </Grid>
                      </Box>
                      <Typography className="subtitle1 m-2">
                        {userTrackingDataLoading ? (
                          <Grid container spacing={2} style={{ padding: '8px' }}>
                            <CommonSkeleton lenArray={[...Array(7).keys()]} />
                          </Grid>
                        ) : userTrackingData.labels.length === 0 ? (
                          <h3>No activity found in the selected date range</h3>
                        ) : (
                          <Line type="line" data={userTrackingData} />
                        )}
                      </Typography>
                    </Box>
                    <Box hidden={userData?.proxyDOA ? currentTabIndex !== 4 : currentTabIndex !== 3}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={12} lg={12}>
                          <Box width="100%" padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between">
                            <Typography variant="subtitle2">Assigned Entity ({entities?.length || 0})</Typography>
                            {permissions?.entity?.isUpdate && permissions?.role?.isUpdate && (
                              <IconButton title="Assign entities" color="primary" size="small" onClick={entityDialogOpen}>
                                <ControlPoint />
                              </IconButton>
                            )}
                          </Box>
                          <Box padding={1}>
                            {loading ? (
                              <Box display="flex">
                                {[1, 2].map((i) => (
                                  <BoxWithBorder
                                    key={i}
                                    style={{
                                      padding: '8px',
                                      margin: '8px',
                                      width: '100%'
                                    }}
                                  >
                                    <Box padding={1}>
                                      <Skeleton variant="text" width="100px" height="20px" />
                                      <Box marginTop={1} />
                                      <Skeleton variant="text" width="100%" height="15px" />
                                    </Box>
                                  </BoxWithBorder>
                                ))}
                              </Box>
                            ) : entities?.length ? (
                              <AssignedEntities
                                entities={entities}
                                permissions={permissions}
                                userId={id}
                                loggedInUser={user?.user}
                                onSuccess={() => {
                                  fetchUserData();
                                }}
                                entityAccessIds={entityAccess}
                                roleAccessIds={roleAccessOfLoggedInUser}
                              />
                            ) : (
                              <Box textAlign="center" padding={2}>
                                <Typography>No Entities </Typography>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </>
                )}
              </Box>

              {/* <Box style={{ padding: "0px", minHeight: "300px" }}>
                <Box display="flex" padding={1} bgcolor="grey.200">
                  <Grid container>
                    <Grid item xs={8}>
                      <Box display="flex">
                        <Box padding="5px">
                          <Typography variant="subtitle2">
                            Assigned Company Wide Roles ({globalRoles.length || "0"})
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={4} container justify="flex-end">
                      {permissions.user.isUpdate && (
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={handleOpenDialog}
                          disabled={!isLoggedInUserBrandAdmin && userData?.userType}
                        >
                          <ControlPoint />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                <Grid container style={{ padding: "8px" }} spacing={1}>
                  <Grid item xs={12} sm={12} md={4}>
                    <BoxWithBorder
                      style={{
                        padding: "0px",
                        height: "352px",
                      }}
                    >
                      {rolesLoading ? (
                        [1, 2].map((i) => (
                          <BoxWithBorder
                            key={i}
                            style={{ padding: "0px", margin: "8px" }}
                          >
                            <Box padding={1}>
                              <Skeleton
                                variant="text"
                                width="100px"
                                height="20px"
                              />
                              <Box marginTop={1} />
                              <Skeleton variant="text" width="100%" height="15px" />
                            </Box>
                          </BoxWithBorder>
                        ))
                      ) : !globalRoles.length ? (
                        <Box textAlign="center" marginTop={2}>
                          <Typography variant="body2">
                            User doesn't have any roles
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          style={{
                            height: "100%",
                            overflowY: "auto",
                          }}
                        >
                          {userData && (
                            <UserRoles
                              permissions={permissions}
                              data={globalRoles}
                              unassignRole={handleUnassignRole}
                              loggedInUser={user?.user}
                              currentUserId={id}

                            />
                          )}
                        </Box>
                      )}
                    </BoxWithBorder>
                  </Grid>
                  <Grid item xs={12} sm={12} md={8} lg={8}>
                    <BoxWithBorder
                      style={{
                        padding: "0px",
                        height: "352px",
                      }}
                    >
                      <RoleEngine
                        field={unionRoleData ? unionRoleData.field : []}
                        resource={unionRoleData ? unionRoleData.resource : []}
                        isDisable={true}
                      />
                    </BoxWithBorder>
                  </Grid>
                </Grid>
              </Box> */}

              {/* <Box>
                <Box
                  width="100%"
                  padding={1}
                  bgcolor="grey.200"
                  display="flex"
                  justifyContent="space-between"
                >
                  <Grid container>
                    <Grid item xs={8}>
                      <Box display="flex">
                        <Box padding="5px">
                          <Typography variant="subtitle2">
                            User Time Track
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box padding="10px">
                  <Grid item xs={12} sm={12} md={12}>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel id="duration">Select Duration</InputLabel>
                            <Select labelId="duration" id="time-duration" value={timeFrame} onChange={(e) => setTimeFrame(e.target.value)}>
                              <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                              <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                              <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                              <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                              <MenuItem value={'custom'}>Custom</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <KeyboardDatePicker
                            disabled={timeFrame !== 'custom'}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            autoOk
                            disableFuture
                            size="small"
                            openTo="year"
                            format={dateFormatForInputControl}
                            maxDate={trackingTime.between.to}
                            label="From"
                            views={['year', 'month', 'date']}
                            value={trackingTime.between.from}
                            onChange={(date) => {
                              setTrackingTime({ between: { from: date, to: trackingTime.between.to } });
                            }}
                          />


                        </Grid>
                        <Grid item xs={6} sm={4}>
                          <KeyboardDatePicker
                            disabled={timeFrame !== 'custom'}
                            inputVariant="outlined"
                            variant="inline"
                            fullWidth
                            autoOk
                            disableFuture
                            size="small"
                            minDate={trackingTime.between.from}
                            openTo="year"
                            format={dateFormatForInputControl}
                            label="To"
                            views={['year', 'month', 'date']}
                            value={trackingTime.between.to}
                            onChange={(date) => {
                              setTrackingTime({ between: { to: date, from: trackingTime.between.from } });
                            }}
                          />
                        </Grid>
                      </Grid>
                    </MuiPickersUtilsProvider>
                  </Grid>
                </Box>
                <Typography className="subtitle1 m-2">
                  {

                    userTrackingDataLoading ?
                      (
                        <Grid container spacing={2} style={{ padding: "8px" }}>
                          <CommonSkeleton lenArray={[...Array(7).keys()]} />
                        </Grid>
                      )
                      :
                      userTrackingData.labels.length === 0 ?
                        (
                          <h3>No activity found in the selected date range</h3>
                        )
                        :
                        <Line type="line" data={userTrackingData} />
                  }
                </Typography>
              </Box> */}
              {/* <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>
                  <Box
                    width="100%"
                    padding={1}
                    bgcolor="grey.200"
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle2">
                      Assigned Entity ({entities?.length || 0})
                    </Typography>
                    {permissions.entity.isUpdate && permissions.role.isUpdate && (
                      <IconButton
                        title="Assign entities"
                        color="primary"
                        size="small"
                        onClick={entityDialogOpen}
                      >
                        <ControlPoint />
                      </IconButton>
                    )}
                  </Box>
                  <Box padding={1}>
                    {loading ? (
                      <Box display="flex">
                        {[1, 2].map((i) => (
                          <BoxWithBorder
                            key={i}
                            style={{
                              padding: "8px",
                              margin: "8px",
                              width: "100%",
                            }}
                          >
                            <Box padding={1}>
                              <Skeleton
                                variant="text"
                                width="100px"
                                height="20px"
                              />
                              <Box marginTop={1} />
                              <Skeleton variant="text" width="100%" height="15px" />
                            </Box>
                          </BoxWithBorder>
                        ))}
                      </Box>
                    ) :
                      entities?.length ? (
                        <AssignedEntities
                          entities={entities}
                          permissions={permissions}
                          userId={id}
                          loggedInUser={user?.user}
                          onSuccess={() => {
                            fetchUserData();
                          }}
                          entityAccessIds={entityAccess}
                          roleAccessIds={roleAccessOfLoggedInUser}
                        />


                      )
                        : (
                          <Box textAlign="center" padding={2}>
                            <Typography>No Entities </Typography>
                          </Box>
                        )
                    }
                  </Box>
                </Grid>
              </Grid> */}

              <div className="p-3">
                {permissions?.[opportunity.opportunityResource]?.isRead && (
                  <OpportunityAccordionInUserDetail
                    opportunities={[...(opportunityRelatedData?.Owner ?? []), ...(opportunityRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {permissions?.[lead.leadResource]?.isRead && (
                  <LeadAccordionInUserDetailPage
                    leads={[...(leadsRelatedData?.Owner ?? []), ...(leadsRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {permissions?.[customerAccount.accountResource]?.isRead && (
                  <AccountAccordionDetail
                    type="customer"
                    accounts={[...(customerAccountRelatedData?.Owner ?? []), ...(customerAccountRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {permissions?.[supplierAccount.accountResource]?.isRead && (
                  <AccountAccordionDetail
                    type="supplier"
                    accounts={[...(supplierAccountRelatedData?.Owner ?? []), ...(supplierAccountRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {permissions?.[customerContact.contactResource]?.isRead && (
                  <ContactAccordionInDetailPage
                    type="customer"
                    contacts={[...(customerContactRelatedData?.Owner ?? []), ...(customerContactRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {permissions?.[supplierContact.contactResource]?.isRead && (
                  <ContactAccordionInDetailPage
                    type="supplier"
                    contacts={[...(supplierContactRelatedData?.Owner ?? []), ...(supplierContactRelatedData?.Collaborator ?? [])]}
                    recordsPerLine={3}
                    expanded={false}
                    userId={id}
                    onSuccess={() => {
                      fetchUserRelatedDetail();
                    }}
                    isAllowedToEdit={false}
                  />
                )}
                {
                  permissions?.[quoteBuilder.qbResource]?.isRead && (
                    <QuotesInAccordion
                      recordsPerLine={3}
                      quotes={[...(quotesRelatedData?.Owner ?? []), ...(quotesRelatedData?.Collaborator ?? [])]}
                      expanded={false}
                      fetchData={() => fetchUserRelatedDetail()}
                      quoteBuilderPermission={permissions?.[quoteBuilder.qbResource]}
                      isAllowedToUpdate={false}
                    />
                  )
                }
              </div>
            </Paper>
          </div>
          <div className="position-relative">
            {/* {showActivity ?
              <Paper className="fixedRightPanel">
                {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                  <IoIosArrowDropright className="icon" />
                </span>}
                <Box className="detailHeader">
                  <h2 className="listingHeader single">Approval Process</h2>
                </Box>
                <Box padding={2}>
                  <FormControl component="fieldset" fullWidth>
                    <FormGroup>
                      {loading ? (
                        [1, 2, 3, 4].map((i) => (
                          <Box
                            padding={1}
                            marginBottom={2}
                            display="flex"
                            key={i}
                          >
                            <Skeleton
                              style={{ borderRadius: 16 }}
                              width="30px"
                              height="30px"
                            />
                            <Box marginX={1} />
                            <Skeleton
                              variant="text"
                              width="80%"
                              height="30px"
                            />
                          </Box>

                        ))
                      ) : userPermissions ? (
                        Object.keys(userPermissions).map((key) => (
                          <Tooltip title={!hasPermissionToUpdateApprovalProcess ? `You do not have permission to update ${startCase(key)}` : ""}>
                            <FormControlLabel
                              key={key}
                              control={
                                <Switch
                                  checked={userPermissions[key]}
                                  name={key}
                                  disabled={!hasPermissionToUpdateApprovalProcess}
                                  onChange={handleChangePermissions}
                                />
                              }
                              label={key === "doaSetup" ? "DOA Setup" : startCase(key)}
                            />
                          </Tooltip>
                        ))
                      ) : (
                        <Typography>There are no permissions</Typography>
                      )}
                    </FormGroup>
                  </FormControl>
                </Box>
                <QuickLinks quickLinks={quickLinks} />
              </Paper>
              :
              !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
                <IoIosArrowDropleft className="icon" />
              </span>} */}

            <Paper className={`${!isSmallScreen ? 'fixedRightPanel' : null}`}>
              {!isSmallScreen && (
                <span className={`${showActivity ? 'activityHide' : 'activityShow'} cursor-pointer`} onClick={handleActivityHideShow}>
                  {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
                </span>
              )}
              <div style={{ display: showActivity ? 'block' : 'none' }}>
                <Box className="detailHeader">
                  <h2 className="listingHeader single">Approval Process</h2>
                </Box>
                <Box padding={2}>
                  <FormControl component="fieldset" fullWidth>
                    <FormGroup>
                      {loading ? (
                        [1, 2, 3, 4].map((i) => (
                          <Box padding={1} marginBottom={2} display="flex" key={i}>
                            <Skeleton style={{ borderRadius: 16 }} width="30px" height="30px" />
                            <Box marginX={1} />
                            <Skeleton variant="text" width="80%" height="30px" />
                          </Box>
                        ))
                      ) : userPermissions ? (
                        Object.keys(userPermissions).map((key) => (
                          <Tooltip title={!hasPermissionToUpdateApprovalProcess ? `You do not have permission to update ${startCase(key)}` : ''}>
                            <FormControlLabel
                              key={key}
                              control={
                                <Switch
                                  checked={userPermissions[key]}
                                  name={key}
                                  disabled={!hasPermissionToUpdateApprovalProcess}
                                  onChange={handleChangePermissions}
                                />
                              }
                              label={key === 'doaSetup' ? 'DOA Setup' : startCase(key)}
                            />
                          </Tooltip>
                        ))
                      ) : (
                        <Typography>There are no permissions</Typography>
                      )}
                    </FormGroup>
                  </FormControl>
                </Box>
                <QuickLinks quickLinks={quickLinks} />
              </div>
            </Paper>
          </div>
        </div>
      </Fragment>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          // message={`Are you sure you want to delete this User ?`}
          // onClose={() => setShowConfirmBox(false)}
          // onOk={handleDeleteUser}
          message={
            deleteUserRec
              ? `Are you sure you want to delete this User ${userData.firstName} ${userData.lastName} ?`
              : roleDeleteRec
                ? `Are you sure you want to unassign ${roleDeleteRec?.name} role from ${userData.firstName} ${userData.lastName} ?`
                : ''
          }
          onClose={() => {
            setShowConfirmBox(false);
            if (roleDeleteRec) setRoleDeleteRec(undefined);
            if (deleteUserRec) setDeleteUserRec(undefined);
          }}
          onOk={deleteUserRec ? DeleteUser : roleDeleteRec ? unassignUserRole : null}
        />
      ) : null}

      {orgChartInFullScreenDialog && (
        <FullScreenDialog
          heading="Org Chart"
          open={orgChartInFullScreenDialog}
          close={() => {
            setOrgChartInFullScreenDialog(false);
          }}
        >
          <OrgChartContainer
            data={orgChartData}
            onClick={(id) => {
              setOrgChartInFullScreenDialog(false);
              history.push(`${routes.userDetail.path}/${id}`);
            }}
          />
        </FullScreenDialog>
      )}
      {showSetupUserDialog && (
        <UserSetupDialog
          open={showSetupUserDialog}
          close={() => {
            history.push({
              pathname: `/user/detail/${id}`,
              search: ''
            });
            setShowSetupUserDialog(false);
            fetchUserData();
          }}
          userIds={[id]}
          onSuccess={() => {
            setShowSetupUserDialog(false);
            history.push({
              pathname: `/user/detail/${id}`,
              search: ''
            });
            fetchUserData();
          }}
          fetchUsers={() => fetchUsers()}
          userList={userList}
          selectedRecords={[{ ...userData }]}
          isRoleSetUpPermission={permissions?.role?.isUpdate && permissions?.entity?.isUpdate && permissions?.user?.isUpdate}
          isApprovalProcess={isLoggedInUserBrandAdmin}
          roleAccessIds={roleAccessOfLoggedInUser}
          entityAccessIds={entityAccess}
        />
      )}
      {showConfirmBox && deleteUserRec ? (
        <ResourceTransferDialog
          open={showConfirmBox}
          resource="User"
          fromResource={[userData]}
          allResourceData={allUsers}
          onClose={() => setShowConfirmBox(false)}
          handleDelete={() => {
            setShowConfirmBox(false);
            history.push(routes.user.path);
          }}
        />
      ) : null}
    </>
  );
};

export default UserDetailsPage;

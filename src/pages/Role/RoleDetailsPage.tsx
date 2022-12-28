import { useState, useEffect, useContext, Fragment } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Grid,
  CircularProgress,
  Typography,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControlLabel,
  Checkbox
} from '@material-ui/core';
import { ControlPoint, KeyboardArrowDown, KeyboardArrowUp } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import RoleEngine from '../../components/Shared/RoleEngine';
import Loader from '../../components/Loader';
import DeleteButton from '../../components/Helpers/DeleteButton';
import AssignedUsers from './AssignedUsers';
import { FaEye } from 'react-icons/fa';
import BoxWithBorder from '../../components/BoxWithBorder';
import AssignUserDialog from '../../components/AssignRolesDialog/AssignUserDialog';
import AssignRegionalRolesUserDialog from '../../components/AssignRolesDialog/AssignRegionalRolesUserDialog';
import { SET_USER, USER_LOADING, SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import { PERMISSION } from '../../constants/Roles';
import { roleTypes } from '../../constants/helpers';
import React from 'react';
import { startCase, camelCase } from 'lodash';
import { RiNurseFill } from 'react-icons/ri';
import PolicyResources from './PolicyResources';
import DashboardResources from './DashboardResources';
import DefaultResources from './DefaultResources';

const RoleDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();
  const {
    state: { user, permissions, selectedEntity },
    dispatch
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [updatedData, setUpdatedData] = useState(null);
  const [roleDeleteRec, setRoleDeleteRec] = useState(null);
  const [entityDeleteRec, setEntityDeleteRec] = useState(null);
  const [userDeleteRec, setUserDeleteRec] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [roleUsers, setRoleUsers] = useState([]);
  const [values, setValues] = useState({
    name: '',
    description: ''
  });
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.role]);

  const showRecordsBeforeViewAll = 2;
  const [showUsers, setShowUsers] = useState(showRecordsBeforeViewAll);
  const [entityAccess, setEntityAccess] = useState([]);
  const [resourceOption, setResourceOption] = useState([]);

  const [open, setOpen] = useState({
    rentalManagement: false,
    sublease: false,
    purchaseOrder: false,
    quoteBuilder: false
  });

  const [policyFieldCheckBox, SetPolicyFieldCheckBox] = useState({
    isPricingRentalManagement: false,
    isPricingSublease: false,
    isRentalReopen: false,
    isPricingPurchaseOrder: false,
    isQuoteAskSupplierPrice: false,
    isQuotationRentalManagement: false,
    isProgressiveBillingRentalManagement: false
  });

  const [resourceCheckbox, setResourceCheckBox] = useState({
    rentalManagement: false,
    sublease: false,
    purchaseOrder: false,
    quoteBuilder: false
  });

  const [isPolicyCheckBoxChecked, setIsPolicyCheckBoxChecked] = useState(false);
  const [dashBoardOption, setDashBoardOption] = useState([]);
  const [dashboardName, setDashboardName] = useState([]);
  const [defaultResourceName, setDefaultResourceName] = useState([]);

  const policyResources = [
    {
      resource: 'Rental Management',
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingRentalManagement'
    },
    {
      resource: 'Rental Management',
      fieldLabel: 'Quotation Information',
      fieldName: 'isQuotationRentalManagement'
    },
    {
      resource: 'Rental Management',
      fieldLabel: 'Progressive Billing',
      fieldName: 'isProgressiveBillingRentalManagement'
    },
    {
      resource: 'Rental Management',
      fieldLabel: 'Re-open',
      fieldName: 'isRentalReopen'
    },
    {
      resource: 'Sublease',
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingSublease'
    },
    {
      resource: 'Purchase Order',
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingPurchaseOrder'
    },
    {
      resource: 'Quote Builder',
      fieldLabel: 'Ask Supplier Quote',
      fieldName: 'isQuoteAskSupplierPrice'
    }
  ];

  const fieldOfPolicyResources = policyResources?.map((obj) => {
    if (obj?.fieldName) {
      return {
        resource: obj?.resource,
        field: obj?.fieldName,
        fieldLabel: obj?.fieldLabel
      };
    }
  });

  const isPolicyTableVisible = () => {
    let accessArray = [];
    policyResources.map((item) => {
      accessArray.push(permissions[camelCase(item.resource)]?.isRead);
    });
    return accessArray.filter((item) => item === true).length > 0;
  };

  useEffect(() => {
    if (id) {
      fetchRoleData();
      fetchLoggedInUserEntities();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (roleData) {
      fetchUser();
      dashboardList();
    }
    // eslint-disable-next-line
  }, [roleData]);

  useEffect(() => {
    const data = {
      name: values.name,
      description: values.description,
      field,
      resource
    };
    setUpdatedData(JSON.stringify(data));
  }, [values, field, resource]);

  useEffect(() => {
    if (resourceCheckbox.purchaseOrder && resourceCheckbox.rentalManagement && resourceCheckbox.sublease) {
      setIsPolicyCheckBoxChecked(true);
    } else {
      setIsPolicyCheckBoxChecked(false);
    }
  }, [resourceCheckbox]);

  const handlePolicyCheckBox = (checkBoxType, e, type = null, resourceObject = null) => {
    if (checkBoxType === 'Select-All') {
      setIsPolicyCheckBoxChecked(e.target.checked);

      setResourceCheckBox({
        rentalManagement: e.target.checked,
        purchaseOrder: e.target.checked,
        sublease: e.target.checked,
        quoteBuilder: e.target.checked
      });

      SetPolicyFieldCheckBox({
        isPricingPurchaseOrder: e.target.checked,
        isPricingRentalManagement: e.target.checked,
        isPricingSublease: e.target.checked,
        isRentalReopen: e.target.checked,
        isQuoteAskSupplierPrice: e.target.checked,
        isQuotationRentalManagement: e.target.checked,
        isProgressiveBillingRentalManagement: e.target.checked
      });
    }
    if (checkBoxType === 'Policy-CheckBox') {
      setResourceCheckBox((prevState) => ({ ...prevState, [camelCase(type)]: e.target.checked }));
      policyResources
        .filter((d) => d.resource === type)
        .forEach((obj) => {
          SetPolicyFieldCheckBox((prevState) => ({ ...prevState, [obj.fieldName]: e.target.checked }));
        });
    }

    if (checkBoxType === 'Fields') {
      SetPolicyFieldCheckBox((prevState) => ({ ...prevState, [type.field]: e.target.checked }));
      let temppolicyFieldCheckBox = policyFieldCheckBox;
      temppolicyFieldCheckBox[type.field] = e.target.checked;
      let tempResourceCheckBox = policyResources.filter((d) => d.resource === type.resource).every((d) => temppolicyFieldCheckBox[d.fieldName]);
      setResourceCheckBox((prevState) => ({ ...prevState, [camelCase(resourceObject)]: tempResourceCheckBox }));
    }
  };

  const handlePolicyResourceCheckBox = async (field) => {
    const resources = Object.keys(resourceCheckbox);
    resources.map((key) => {
      const isAllFieldChecked = policyResources?.filter((item) => item.resource === startCase(key))?.some((obj) => field[obj.fieldName] === false);
      if (!isAllFieldChecked) {
        setResourceCheckBox((prevState) => ({ ...prevState, [key]: true }));
      }
    });
  };

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/role/${id}`);
      setHeadingLbl(data.name);
      setRoleData(data);
      setValues({ name: data.name, description: data.description });
      setField(data.field);
      setResource(data.resource);
      const current = {
        name: data.name,
        description: data.description,
        field: data.field,
        resource: data.resource
      };
      setCurrentData(JSON.stringify(current));
      setCustomizedRoutes([routes.role, { title: data.name }]);
      if (data?.policy) {
        let copyOfResourcePolicy = {};
        for (const item in data?.policy) {
          copyOfResourcePolicy[item] = data?.policy[item];
        }
        SetPolicyFieldCheckBox((prevState) => ({ ...prevState, ...copyOfResourcePolicy }));
        handlePolicyResourceCheckBox(copyOfResourcePolicy);
      }
      let copyOfDashBoardOption =
        data?.resource?.map((obj) => {
          return obj?.resourceLabel;
        }) || [];
      setResourceOption([...copyOfDashBoardOption]);
      setDefaultResourceName(data?.defaultResource || '');
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchUser = async () => {
    setLoading(true);
    // let api = roleData?.type === 1 ? `user?filterById=[{"field": "role", "term": "${id}"}]` : `/user?filterById=[{"field": "entities.entity", "term": "${id}"}]`
    try {
      const {
        data: { data }
      } = await axiosInstance().get(
        roleData?.type === roleTypes.find((d) => d.key === 'Global')?.value
          ? `user?filterById=[{"field": "role", "term": "${id}"}]`
          : `/user?filterById=[{"field": "entities.role", "term": "${id}"}]`
      );
      setRoleUsers(data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const checkError = () => {
    return values?.name?.length === 0 || values?.description?.length === 0;
  };

  const dashboardList = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dashboard-master`);
      let copyOfDashBoardOption = data?.map((obj) => {
        return { id: obj._id, name: obj.name };
      });

      setDashBoardOption([...copyOfDashBoardOption]);

      const dashBoardNames = copyOfDashBoardOption.filter((obj) => roleData.dashBoards.includes(obj.id));
      setDashboardName(dashBoardNames);

      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleUpdateRole = () => {
    setUpdating(true);
    let dashBoardIds = dashboardName.map((obj) => obj.id);
    axiosInstance()
      .put(`/role`, {
        _id: id,
        ...values,
        field,
        resource,
        type: roleData.type,
        policy: policyFieldCheckBox,
        dashBoards: dashBoardIds,
        defaultResource: defaultResourceName
      })
      .then(({ data }) => {
        fetchRoleData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });

        setUpdating(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleDeleteRole = () => {
    if (id) {
      axiosInstance()
        .put(`/role/remove`, { ids: [id] })
        .then(() => {
          setShowConfirmBox(false);
          history.goBack();
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
    }
  };

  const handleUnassignUser = (rec) => {
    setUserDeleteRec(rec);
    setShowConfirmBox(true);
  };

  const unassignUserRole = () => {
    if (userDeleteRec?._id) {
      const data = {
        user: userDeleteRec?._id,
        roles: [id]
      };
      axiosInstance()
        .put('/user/un-assign-role', data)
        .then(() => {
          setShowConfirmBox(false);

          if (showUsers - 1 >= 2) {
            setShowUsers(showUsers - 1);
          }

          fetchRoleData();
          toastConfig.setToastConfig({
            message: 'Successfully unassigned user',
            type: 'success',
            open: true
          });
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    }
  };

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  const fetchUserData = () => {
    dispatch({ type: USER_LOADING, payload: true });
    axiosInstance()
      .get('/user/me')
      .then(({ data: response }) => {
        const { data } = response;
        dispatch({ type: SET_USER, payload: data });
        if (data?.role?.selectedEntity?._id) {
          dispatch({
            type: SET_SELECTED_ENTITY,
            payload: data.role.selectedEntity._id
          });
        }
        dispatch({ type: USER_LOADING, payload: false });
      })
      .catch((err) => {
        localStorage.setItem('token', '');
        dispatch({ type: USER_LOADING, payload: false });
      });
  };

  const unassignEntity = () => {
    if (entityDeleteRec && entityDeleteRec._id) {
      axiosInstance()
        .put(`/entity/remove-role`, {
          entities: [entityDeleteRec._id],
          role: id
        })
        .then(({ data }) => {
          fetchRoleData();
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setShowConfirmBox(false);
          fetchUserData();
        })
        .catch((error) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const isEditDeleteDisable = [PERMISSION.superAdmin, PERMISSION.brandAdmin].indexOf(roleData?.permission) >= 0;

  return (
    <>
      {showAssignUserDialog &&
        (roleData?.type === roleTypes.find((d) => d.key === 'Global')?.value ? (
          <AssignUserDialog
            usersDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            roleIds={[id]}
            assignedUsers={roleUsers}
            onSuccess={() => {
              fetchRoleData();
              userDialogClose();
            }}
            selectedEntity={selectedEntity || ''}
          />
        ) : (
          <AssignRegionalRolesUserDialog
            entitiesDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            ids={[id]}
            assignedUsers={roleUsers}
            onSuccess={() => {
              fetchRoleData();
              userDialogClose();
            }}
            entityAccessIds={entityAccess}
          />
        ))}

      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Paper>
              {!roleData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={headingLbl} showHeading={true}>
                  {permissions.role.isUpdate ? (
                    <Button disabled={isUpdating || checkError()} variant="contained" color="primary" size="small" onClick={handleUpdateRole}>
                      {isUpdating ? <CircularProgress size={22} /> : 'Update'}
                    </Button>
                  ) : null}
                  <Box marginX={1} component="span" />
                  {permissions.role.isDelete && !isEditDeleteDisable ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => {
                        setRoleDeleteRec(id);
                        setShowConfirmBox(true);
                      }}
                    />
                  ) : null}
                </DetailsPageHeader>
              )}

              <Box display="flex" marginTop={2} marginBottom={2} gridGap={10} px={1}>
                <TextField
                  disabled={roleData?.type && roleData?.permission ? true : !permissions.role.isUpdate}
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  label="Role Name"
                  value={values.name}
                  onChange={(e) => setValues({ ...values, name: e.target.value.trimStart() })}
                />

                <TextField
                  disabled={roleData?.type && roleData?.permission ? true : !permissions.role.isUpdate}
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  label="Role Description"
                  value={values.description}
                  onChange={(e) => setValues({ ...values, description: e.target.value.trimStart() })}
                />
              </Box>
              <Paper>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200, height: '70vh' }}>
                    <Loader style={{ height: '100%' }} text="Loading..." />
                  </div>
                ) : (
                  field.length &&
                  resource.length && (
                    <>
                      <RoleEngine
                        style={{ height: '70vh' }}
                        field={field}
                        resource={resource}
                        setField={setField}
                        setResource={setResource}
                        isDisable={permissions.role.isUpdate ? (isEditDeleteDisable ? true : false) : true}
                      />
                      {isPolicyTableVisible() && (
                        <PolicyResources
                          policyResources={policyResources}
                          fieldOfPolicyResources={fieldOfPolicyResources}
                          resourceCheckbox={resourceCheckbox}
                          policyFieldCheckBox={policyFieldCheckBox}
                          isPolicyCheckBoxChecked={isPolicyCheckBoxChecked}
                          handlePolicyCheckBox={handlePolicyCheckBox}
                          open={open}
                          setOpen={setOpen}
                          permissions={permissions}
                        />
                      )}
                      {dashBoardOption?.length > 0 && (
                        <DashboardResources dashboardList={dashBoardOption} dashboardName={dashboardName} setDashboardName={setDashboardName} />
                      )}
                      <DefaultResources resourceList={resourceOption} resourceName={defaultResourceName} setResourceName={setDefaultResourceName} />
                    </>
                  )
                )}
                {/* </TableBody>
                  </Table>
                </TableContainer> */}
              </Paper>
              <Box marginY={2} />
              {/* {roleData && roleData.type === 2 && (
                <div>
                  <Box
                    padding={1}
                    bgcolor="grey.200"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="subtitle2">
                      Assigned Entities (
                    {(roleData && roleData.entity.length) || 0})
                  </Typography>

                    {permissions.role.isUpdate && (
                      <IconButton
                        title="Assign Entities"
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
                              <Skeleton
                                variant="text"
                                width="100%"
                                height="15px"
                              />
                            </Box>
                          </BoxWithBorder>
                        ))}
                      </Box>
                    ) : roleData.entity.length ? (
                      <>
                        <AssignedEntities
                          selectedEntity={selectedEntity}
                          permissions={permissions}
                          data={roleData && roleData.entity.slice(0, showEntities)}
                          unassignEntity={handleUnassignEntity}
                        />

                        <Box marginY={1} />
                        {
                          roleData.entity.length > showRecordsBeforeViewAll && <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => setShowEntities(roleData.entity.length)}
                          >
                            View All ({roleData.entity.length})
                          </Button>
                        }
                      </>
                    ) : (
                      <Box textAlign="center" padding={2}>
                        <Typography>No entities has been assigned </Typography>
                      </Box>
                    )}
                  </Box>
                </div>
              )} */}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Paper>
              <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Assigned Users ({roleUsers.length || 0})</Typography>

                {permissions.role.isUpdate && (
                  <IconButton title="Assign users" color="primary" size="small" onClick={userDialogOpen}>
                    <ControlPoint />
                  </IconButton>
                )}
              </Box>
              {roleUsers && (
                <Box>
                  {loading ? (
                    [1, 2].map((i) => (
                      <BoxWithBorder
                        key={i}
                        style={{
                          margin: '8px'
                        }}
                      >
                        <Box padding={1}>
                          <Skeleton variant="text" width="100px" height="20px" />
                          <Box marginTop={1} />
                          <Skeleton variant="text" width="100%" height="15px" />
                        </Box>
                      </BoxWithBorder>
                    ))
                  ) : roleUsers.length ? (
                    <>
                      <AssignedUsers
                        permissions={permissions}
                        unassignRole={handleUnassignUser}
                        data={roleUsers && roleUsers.slice(0, showUsers)}
                        currentUser={user?.user._id}
                        type={roleData?.type}
                      />
                      <Box marginY={1} />
                      {roleUsers.length > showRecordsBeforeViewAll && (
                        <Box
                          className="btn-view gap-1"
                          p={1}
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          onClick={() =>
                            history.push(`/user`, {
                              id: roleData._id,
                              name: roleData.name,
                              type: roleData.type === roleTypes.find((d) => d.key === 'Global')?.value ? 'globalRole' : 'regionalRole',
                              text:
                                roleData.type === roleTypes.find((d) => d.key === 'Global')?.value
                                  ? 'Company wide role'
                                  : 'Region wide functional role'
                            })
                          }
                        >
                          <FaEye /> View All &#8599;
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box textAlign="center" padding={2}>
                      <Typography>No users has been assigned </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            roleDeleteRec
              ? `Are you sure you want to delete this Role ?`
              : userDeleteRec
              ? `Are you sure you want to unassign ${userDeleteRec.firstName} from this Role?`
              : entityDeleteRec
              ? `Are you sure you want to unassign ${entityDeleteRec.entityName} from this Role?`
              : ''
          }
          onClose={() => {
            setShowConfirmBox(false);
            setUserDeleteRec(null);
            setRoleDeleteRec(null);
            setEntityDeleteRec(null);
          }}
          onOk={roleDeleteRec ? handleDeleteRole : entityDeleteRec ? unassignEntity : unassignUserRole}
        />
      )}
    </>
  );
};

export default RoleDetailsPage;

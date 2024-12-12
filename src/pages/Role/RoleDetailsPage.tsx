import { Box, Button, Checkbox, CircularProgress, FormControlLabel, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import { ControlPoint } from '@material-ui/icons';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import { camelCase, startCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import DeviceMessage from 'src/components/ScreenMessages/DeviceMessage';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER, USER_LOADING } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import AssignRegionalRolesUserDialog from '../../components/AssignRolesDialog/AssignRegionalRolesUserDialog';
import AssignUserDialog from '../../components/AssignRolesDialog/AssignUserDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import Loader from '../../components/Loader';
import RoleEngine from '../../components/Shared/RoleEngine';
import { PERMISSION } from '../../constants/Roles';
import { ROLE_TIER, roleTypes, sidebarResource } from '../../constants/helpers';
import AssignedUsers from './AssignedUsers';
import DashboardResources from './DashboardResources';
import DefaultResources from './DefaultResources';
import PolicyResources from './PolicyResources';
import ImportExportRole from 'src/pages/Role/ImportExportRole';

const RoleDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const { id } = useParams();
  const {
    state: { user, permissions, selectedEntity, resources },
    dispatch
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [roleData, setRoleData] = useState(null);
  const [roleDeleteRec, setRoleDeleteRec] = useState(null);
  const [entityDeleteRec, setEntityDeleteRec] = useState(null);
  const [userDeleteRec, setUserDeleteRec] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [childrenResource, setChildrenResource] = useState([]);
  const [roleUsers, setRoleUsers] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [values, setValues] = useState({
    name: '',
    description: '',
    tier: ''
  });
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.role, title: resources?.role?.titleSingular }]);

  const showRecordsBeforeViewAll = 2;
  const [showUsers, setShowUsers] = useState(showRecordsBeforeViewAll);
  const [entityAccess, setEntityAccess] = useState([]);
  const [resourceOption, setResourceOption] = useState([]);

  const [open, setOpen] = useState({
    rentalManagement: false,
    sublease: false,
    purchaseOrder: false,
    quoteBuilder: false,
    productInventory: false
  });

  const [policyFieldCheckBox, SetPolicyFieldCheckBox] = useState({
    isPricingRentalManagement: false,
    isPricingSublease: false,
    isRentalReopen: false,
    isPricingPurchaseOrder: false,
    isQuoteAskSupplierPrice: false,
    isProductInventorySettings: false,
    isApproveAccount: false,
    isConvertLeadToOpportunity: false,
    isAllowServicePerformRentalManagement: false
  });

  const [resourceCheckbox, setResourceCheckBox] = useState({
    rentalManagement: false,
    sublease: false,
    purchaseOrder: false,
    quoteBuilder: false,
    productInventory: false,
    customerAccount: false,
    lead: false
  });

  const [isPolicyCheckBoxChecked, setIsPolicyCheckBoxChecked] = useState(false);
  const [dashBoardOption, setDashBoardOption] = useState([]);
  const [dashboardName, setDashboardName] = useState([]);
  const [defaultResourceName, setDefaultResourceName] = useState([]);
  const [superAdminAccess, setSuperAdminAccess] = useState(false);
  const [canAssignByAnyuser, setCanAssignByAnyuser] = useState(false);

  const policyResources = [
    {
      resource: sidebarResource.rentalManagement,
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingRentalManagement'
    },
    {
      resource: sidebarResource.rentalManagement,
      fieldLabel: 'Re-open',
      fieldName: 'isRentalReopen'
    },
    {
      resource: sidebarResource.rentalManagement,
      fieldLabel: 'Allow Service Perform',
      fieldName: 'isAllowServicePerformRentalManagement'
    },
    {
      resource: sidebarResource.sublease,
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingSublease'
    },
    {
      resource: sidebarResource.purchaseOrder,
      fieldLabel: 'Pricing Information',
      fieldName: 'isPricingPurchaseOrder'
    },
    {
      resource: sidebarResource.quotation,
      fieldLabel: 'Ask Supplier Quote',
      fieldName: 'isQuoteAskSupplierPrice'
    },
    {
      resource: sidebarResource.productInventory,
      fieldLabel: 'Product Inventory Settings',
      fieldName: 'isProductInventorySettings'
    },
    {
      resource: sidebarResource.customerAccount,
      fieldLabel: 'Approve Account',
      fieldName: 'isApproveAccount'
    },
    {
      resource: sidebarResource.lead,
      fieldLabel: 'Convert Lead To Opportunity',
      fieldName: 'isConvertLeadToOpportunity'
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
        quoteBuilder: e.target.checked,
        productInventory: e.target.checked,
        customerAccount: e.target.checked,
        lead: e.target.checked
      });

      SetPolicyFieldCheckBox({
        isPricingPurchaseOrder: e.target.checked,
        isPricingRentalManagement: e.target.checked,
        isPricingSublease: e.target.checked,
        isRentalReopen: e.target.checked,
        isQuoteAskSupplierPrice: e.target.checked,
        isProductInventorySettings: e.target.checked,
        isApproveAccount: e.target.checked,
        isConvertLeadToOpportunity: e.target.checked,
        isAllowServicePerformRentalManagement: e.target.checked
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
      setRoleData(data);
      setValues({ name: data.name, description: data.description, tier: data?.tier || ROLE_TIER?.tier1 });
      setResource(data.resource);
      setChildrenResource(data.childrenResource);
      setField(data.field);
      const current = {
        name: data.name,
        description: data.description,
        field: data.field,
        resource: data.resource
      };
      setCustomizedRoutes([{ ...routes.role, title: resources?.role?.titleSingular }, { title: data.name }]);
      if (data?.policy) {
        let copyOfResourcePolicy = {};
        for (const item in data?.policy) {
          copyOfResourcePolicy[item] = data?.policy[item];
        }
        SetPolicyFieldCheckBox((prevState) => ({ ...prevState, ...copyOfResourcePolicy }));
        handlePolicyResourceCheckBox(copyOfResourcePolicy);
      }
      setResourceOption(
        data?.resource?.map((obj) => {
          return { optionLabel: obj?.resourceLabel, optionValue: obj?.name };
        }) || []
      );
      setDefaultResourceName(data?.defaultResource || '');
      setSuperAdminAccess(data?.superAdminAccess || false);
      setCanAssignByAnyuser(data?.canAssignByAnyuser || false);
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
    return values?.name?.length === 0 || values?.description?.length === 0 || values?.tier?.length === 0 || !values?.tier;
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

    const resources = resource.map((r) => {
      const newData = { ...r };
      delete newData.isReadDisabled;
      delete newData.isUpdateDisabled;
      delete newData.isCreateDisabled;
      delete newData.isDeleteDisabled;
      delete newData.isHiddenDisabled;
      return newData;
    });

    const fields = field.map((r) => {
      const newData = { ...r };
      delete newData.isReadDisabled;
      delete newData.isUpdateDisabled;
      delete newData.isCreateDisabled;
      delete newData.isDeleteDisabled;
      delete newData.isHiddenDisabled;
      return newData;
    });

    axiosInstance().put(`/role`, {
      _id: id,
      ...values,
      field: fields,
      resource: resources,
      type: roleData.type,
      policy: policyFieldCheckBox,
      dashBoards: dashBoardIds,
      defaultResource: defaultResourceName,
      superAdminAccess: superAdminAccess,
      canAssignByAnyuser: canAssignByAnyuser
    }).then(({ data }) => {
      fetchRoleData();
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: data.message
      });
      setUpdating(false);
      setIsEdit(false);
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
          history.push(`${routes.role.path}`);
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

  const updateChildResource = (resource, access, checked) => {
    const toUpdateResource = [...childrenResource];
    const newField = [...field];
    toUpdateResource?.forEach((_childResource) => {
      if (_childResource.parentResource === resource) {
        const childResourceFields = newField.filter((_field) => _field.fieldData.resource === _childResource.name);
        _childResource[access] = checked;
        if (checked) {
          _childResource['isRead'] = checked;
        }
        childResourceFields?.forEach((_field) => {
          _field[access] = checked;
          if (access === 'isCreate' || access === 'isUpdate') {
            if (checked) {
              _field['isRead'] = checked;
            }
          }
        });
      }
    });
    setChildrenResource(toUpdateResource);
  };

  const isEditDeleteDisable = [PERMISSION.superAdmin, PERMISSION.brandAdmin].indexOf(roleData?.permission) >= 0;

  return (
    <>
      <DeviceMessage />
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {roleData ? (
                <>
                  <ImportExportRole
                    resource={resource}
                    field={field}
                    childrenResource={childrenResource}
                    setField={setField}
                    setResource={setResource}
                    setChildrenResource={setChildrenResource}
                    roleName={values?.name}
                    isExport={!isEditDeleteDisable}
                    isImport={permissions?.role.isUpdate && isEdit && !isEditDeleteDisable}
                  />
                  {permissions?.role.isUpdate && !isEdit && (
                    <Button variant="contained" color="primary" size="medium" onClick={() => setIsEdit(true)}>
                      Edit
                    </Button>
                  )}
                  {permissions?.role.isUpdate && isEdit && (
                    <Button
                      disabled={isUpdating || checkError() || !isEdit}
                      variant="contained"
                      color="primary"
                      size="medium"
                      onClick={handleUpdateRole}
                    >
                      {isUpdating ? <CircularProgress size={22} /> : 'Update'}
                    </Button>
                  )}
                  {permissions?.role.isDelete && !isEditDeleteDisable && (
                    <DeleteButton
                      text="Delete"
                      onClick={() => {
                        setRoleDeleteRec(id);
                        setShowConfirmBox(true);
                      }}
                    />
                  )}
                </>
              ) : (
                <Skeleton variant="text" width="150px" height="32px" />
              )}
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12} md={8} lg={8}>
              <div className="mb-4">
                <Grid container spacing={1}>
                  <Grid item lg={5} md={5} sm={12} xs={12}>
                    <TextField
                      disabled={roleData?.type && roleData?.permission ? true : !permissions?.role?.isUpdate || !isEdit}
                      required
                      variant="outlined"
                      size="small"
                      fullWidth
                      label="Role Name"
                      value={values.name}
                      onChange={(e) => setValues({ ...values, name: e.target.value.trimStart() })}
                    />
                  </Grid>
                  <Grid item lg={5} md={5} sm={12} xs={12}>
                    <TextField
                      disabled={roleData?.type && roleData?.permission ? true : !permissions?.role?.isUpdate || !isEdit}
                      required
                      variant="outlined"
                      size="small"
                      fullWidth
                      label="Role Description"
                      value={values.description}
                      onChange={(e) => setValues({ ...values, description: e.target.value.trimStart() })}
                    />
                  </Grid>
                  <Grid item lg={2} md={2} sm={12} xs={12}>
                    <Autocomplete
                      id={`roleTier`}
                      disabled={roleData?.type && roleData?.permission ? true : !permissions?.role?.isUpdate || !isEdit}
                      options={Object.values(ROLE_TIER)}
                      autoHighlight
                      disableClearable
                      renderOption={(option) => option || ''}
                      onChange={(event: any, newValue: any) => {
                        setValues({ ...values, tier: newValue });
                      }}
                      getOptionLabel={(option) => option || ''}
                      value={values?.tier}
                      renderInput={(params) => <TextField {...params} label="Tier" margin="none" size="small" variant="outlined" />}
                    />
                  </Grid>
                </Grid>
              </div>
              <div>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200, height: '70vh' }}>
                    <Loader style={{ height: '100%' }} text="Loading..." />
                  </div>
                ) : (
                  field.length &&
                  resource.length && (
                    <>
                      <RoleEngine
                        style={{ height: '603px', boxShadow: '0px 20.3165px 40.6331px rgba(0, 0, 0, 0.03)' }}
                        field={field}
                        resource={resource}
                        setField={setField}
                        setResource={setResource}
                        updateChildResource={updateChildResource}
                        isDisable={permissions?.role.isUpdate ? (isEditDeleteDisable || !isEdit ? true : false) : true}
                        tier={values?.tier}
                      />
                      {childrenResource?.length && (
                        <Box mt={2}>
                          <RoleEngine
                            style={{ height: '603px', boxShadow: '0px 20.3165px 40.6331px rgba(0, 0, 0, 0.03)' }}
                            field={field}
                            resource={childrenResource?.map((e, index) => {
                              return { ...e, resourceId: index };
                            })}
                            setField={setField}
                            setResource={setChildrenResource}
                            isDisable={permissions?.role.isUpdate ? (!isEdit ? true : false) : true}
                            tier={ROLE_TIER.tier1}
                            child={true}
                          />
                        </Box>
                      )}
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
                          isEdit={isEdit}
                        />
                      )}
                      {dashBoardOption?.length > 0 && (
                        <DashboardResources
                          dashboardList={dashBoardOption}
                          dashboardName={dashboardName}
                          setDashboardName={setDashboardName}
                          isEdit={isEdit}
                        />
                      )}
                      <DefaultResources
                        resourceList={resourceOption}
                        resourceName={defaultResourceName}
                        setResourceName={setDefaultResourceName}
                        isEdit={isEdit}
                      />
                      {!isEditDeleteDisable && (
                        <Box p={1}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                name="canAssignByAnyuser"
                                checked={canAssignByAnyuser}
                                onChange={(e) => {
                                  setCanAssignByAnyuser(e.target.checked);
                                }}
                                color="primary"
                                disabled={!isEdit}
                              />
                            }
                            label="Can Assign By Anyuser"
                          />
                        </Box>
                      )}
                      <Box p={1} pb={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              name="superAdminAccess"
                              checked={superAdminAccess}
                              onChange={(e) => {
                                setSuperAdminAccess(e.target.checked);
                              }}
                              color="primary"
                              disabled={!isEdit}
                            />
                          }
                          label="Super Admin Access"
                        />
                      </Box>
                    </>
                  )
                )}
              </div>
              <Box marginY={2} />
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4}>
              <Box className="single-form-v1 ">
                <Box className="form-head-v1">
                  <Typography component={'h3'}>Assigned Users ({roleUsers.length || 0})</Typography>
                  {permissions?.role.isUpdate && (
                    <IconButton className="float-right-button-v1" title="Assign users" color="primary" size="small" onClick={userDialogOpen}>
                      <ControlPoint />
                    </IconButton>
                  )}
                </Box>
                <Box className="formdata-v1">
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
                          {roleUsers.length > showRecordsBeforeViewAll && (
                            <>
                              <Box marginY={2} />
                              <Button
                                variant="outlined"
                                className="accordion-outlined-button"
                                startIcon={<FaEye />}
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
                                View All
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <Box textAlign="center" padding={2}>
                          <Typography>No users has been assigned </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
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
      </Box>
    </>
  );
};

export default RoleDetailsPage;

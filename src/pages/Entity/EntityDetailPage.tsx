import { ControlPoint } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Dialog, IconButton, Skeleton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaEye } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomDialogTransition, DOA_RESOURCE } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY, SET_USER, USER_LOADING } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import NewStepper from '../../components/Helpers/NewStepper';
import routes from '../../components/Helpers/Routes';
import ResourceTransferDialog from '../../components/ResourceTransferDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import DoaDialog from '../DoaSetup/ManageDoa/ManageDoaDialog';
import DoaSetup from '../DoaSetupNew';
import AssignedUsers from './AssignedUsers';
import ManageEntity from './ManageEntity';

const EntityDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources },
    dispatch
  }: any = useData();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [entityData, setEntityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [entityFields, setEntityFIelds] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [userDeleteRec, setUserDeleteRec] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.entity, title: resources?.entity?.titlePlural }]);
  const showRecordsBeforeViewAll = 2;
  const [showUsers, setShowUsers] = useState(showRecordsBeforeViewAll);
  const [doa, setDoa] = useState<any[]>([]);
  const [doaCurrency, setDoaCurrency] = useState('');
  const [doaType, setDoaType] = useState(null);
  const [doaApproveType, setDoaApproveType] = useState(null);
  const [doaMinLimit, setDoaMinLimit] = useState(null);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  const [doaDialogOpen, setDoaDialogOpen] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [showDeleteEntityDialog, setShowDeleteEntityDialog] = useState(false);
  useEffect(() => {
    if (id) {
      getEntityFields();
      fetchEntityData();
      fetchEntityUser();
      fetchDoa();
      fetchLoggedInUserRole();
    }
  }, [id]);

  const fetchEntityData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/entity/${id}`);

      handleMainPoints(data);
      setEntityData(data);
      setCustomizedRoutes([{ ...routes.entity, title: resources?.entity?.titlePlural }, { title: data?.entityName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchEntityUser = () => {
    setUsersLoading(true);
    axiosInstance()
      .get(`/user?filterById=[{"field": "entities.entity", "term": "${id}"}]`)
      .then(({ data: { data } }) => {
        setUsers(data);
        getRows(data);
        setUsersLoading(false);
      })
      .catch((err) => {
        setUsersLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data?.entityName}`,
      taxJurisdiction: data.taxJurisdiction || ''
    };
    setMainPoints(tempMp);
  };

  const getEntityFields = () => {
    axiosInstance()
      .get('/field?resource=Entity')
      .then(({ data }) => {
        setEntityFIelds(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteEntity = () => {
    if (id) {
      if (permissions?.entity?.isDelete) {
        axiosInstance()
          .put(`/entity/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            fetchUserData();
            history.push(`${routes.entity.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
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

  const handleUpdateEntity = (values) => {
    setUpdating(true);

    axiosInstance()
      .put(`/entity`, { _id: id, ...values })
      .then(({ data }) => {
        fetchEntityData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setUpdating(false);
        closeUpdateDIalog();
        fetchUserData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };

  const handleUnassignUser = (rec) => {
    setUserDeleteRec(rec);
    setShowConfirmBox(true);
  };

  const unassignUserEntity = () => {
    if (userDeleteRec?._id) {
      const data = {
        user: userDeleteRec?._id,
        entities: userDeleteRec?.entities.filter((d) => d.entity !== id),
        withoutRoleLookup: true
      };
      axiosInstance()
        .put('/user/assign-entity', data)
        .then(() => {
          setShowConfirmBox(false);

          if (showUsers - 1 >= 2) {
            setShowUsers(showUsers - 1);
          }

          fetchEntityUser();
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

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
  };

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  const fieldsToShowInDetailPage = entityFields.filter((field) => field.isRead);

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

  const fetchDoa = async () => {
    axiosInstance()
      .get(`/doa/${id}`)
      .then(({ data: { data } }) => {
        let doaData = [];

        // data.doa.forEach((item) => {
        //   //  When the user set in doa was deleted, we are getting {} in array like this [{}]
        //   //  So added this check
        //   if (!isObjectEmpty(item)) {
        //     doaData.push({
        //       id: item.user?._id,
        //       name: [item.user?.firstName, item.user?.lastName].filter(f => f).join(" "),
        //       firstName: item.user?.firstName,
        //       lastName: item.user?.lastName,
        //       amount: item.amount,
        //     });
        //   }
        // });

        setDoa(data?.doa);
        setDoaCurrency(data?.doaCurrency);
        setDoaType(data?.doaType);
        setDoaMinLimit(data?.doaMinLimit);
        setDoaApproveType(data?.doaApproveType ? data?.doaApproveType : 'User');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
        setDoa([]);
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {entityData ? (
              <>
                {permissions?.entity?.isUpdate && (
                  <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                    {'Edit'}
                  </ThemeButton>
                )}
                {permissions?.entity?.isDelete && (
                  <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowDeleteEntityDialog(true)} />
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
          <Grid size={{ xs: 12, sm: 12, md: 8, lg: 8 }} spacing={2}>
            <Box>
              {loading || !entityFields.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Grid>
              ) : (
                <DetailsPage data={entityData} fields={fieldsToShowInDetailPage} />
              )}
            </Box>
            <Box mt={2} className="single-form-v1 ">
              <div className="relative flex justify-between rounded-t bg-[var(--dark-secondary,var(--accordion-expanded-summary-bg,#EFFBF9))] px-7 py-4">
                <h6 className="text-sm font-semibold leading-[1.05] ">DOA Details</h6>
                {permissions.entity?.isUpdate && (
                  <span className="absolute right-5 top-[50%] [transform:translateY(-50%)]">
                    <ThemeButton buttonType="theme" onClick={() => setDoaDialogOpen(true)}>
                      {doa.length > 0 ? 'Edit DOA' : 'Add DOA'}
                    </ThemeButton>
                  </span>
                )}
              </div>
              <Box className="formdata-v1">
                <Grid container style={{ padding: '8px' }} spacing={1}>
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <BoxWithBorder
                      style={{
                        padding: '0px'
                      }}
                    >
                      {doa.length > 0 ? (
                        <NewStepper heading={' '} steps={doa} doaCurrency={doaCurrency} doaApproveType={doaApproveType} />
                      ) : (
                        <Box textAlign="center" my={2}>
                          <Typography variant="body2">Entity doesn't have any DOA</Typography>
                        </Box>
                      )}
                    </BoxWithBorder>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            {DOA_RESOURCE?.filter((_r) => permissions[_r.key]?.isRead)?.map((_r) => (
              <Box>
                <DoaSetup resource={_r.resorce} entity={id} />
              </Box>
            ))}
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 4, lg: 4 }} spacing={2}>
            <Box style={{ overflow: 'hidden' }} className="single-form-v1">
              <Box className="form-head-v1">
                <Typography component={'h3'}>Assigned Users ({users.length || 0})</Typography>
                {permissions.entity.isUpdate && (
                  <IconButton className="float-right-button-v1" title="Assign users" color="primary" size="small" onClick={userDialogOpen}>
                    <ControlPoint />
                  </IconButton>
                )}
              </Box>
              <Box className="formdata-v1">
                {usersLoading ? (
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
                ) : users.length ? (
                  <>
                    <AssignedUsers permissions={permissions} user={users.slice(0, showUsers)} unassignEntity={handleUnassignUser} type="entity" />

                    {users.length > showRecordsBeforeViewAll && (
                      <>
                        <Box marginY={2} />
                        <ThemeButton
                          onClick={() =>
                            history.push(`/user`, {
                              id: entityData._id,
                              name: entityData?.entityName,
                              type: 'entity',
                              text: 'Entity'
                            })
                          }
                          fullWidth
                          startIcon={<FaEye />}
                        >
                          View All &#8599;
                        </ThemeButton>
                      </>
                    )}
                  </>
                ) : (
                  <Box textAlign="center" padding={2}>
                    <Typography>No Users </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={
            userDeleteRec
              ? `Are you sure you want to un-assign user ${userDeleteRec.firstName} ${userDeleteRec.lastName}?`
              : `Are you sure you want to delete this entity ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={userDeleteRec ? unassignUserEntity : handleDeleteEntity}
        />
      ) : null}
      {showDeleteEntityDialog ? (
        <ResourceTransferDialog
          open={true}
          resource="Entity"
          fromResource={{ ...entityData, name: entityData?.entityName }}
          allResourceData={user?.entity?.map((e) => ({ ...e, optionLabel: e?.entityName, optionValue: e?._id }))}
          onClose={() => setShowDeleteEntityDialog(false)}
          handleDelete={handleDeleteEntity}
        />
      ) : null}
      {doaDialogOpen && (
        <DoaDialog
          userList={userList}
          doa={doa}
          doaCurrency={doaCurrency}
          selectedEntity={[id]}
          open={doaDialogOpen}
          onSuccess={() => {
            setDoaDialogOpen(false);
            fetchDoa();
          }}
          onClose={() => {
            setDoaDialogOpen(false);
          }}
          doaType={doaType}
          doaMinLimit={doaMinLimit}
          doaApproveType={doaApproveType}
        />
      )}
      {showAssignUserDialog && (
        <Dialog
          TransitionComponent={CustomDialogTransition}
          fullScreen={isMobile || isTablet}
          fullWidth
          maxWidth="sm"
          open={showAssignUserDialog}
          onClose={userDialogClose}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            type="user"
            ids={[id]}
            assignedEntity={users}
            regionalRole={false}
            onSuccess={() => {
              fetchEntityUser();
              userDialogClose();
            }}
            roleAccessIds={roleAccessOfLoggedInUser}
          />
        </Dialog>
      )}
      {openUpdateDialog && (
        <ManageEntity
          open={openUpdateDialog}
          close={closeUpdateDIalog}
          fetchData={() => {
            fetchEntityData();
          }}
          values={entityData}
          isNew={false}
        />
      )}
    </Box>
  );
};

export default EntityDetailsPage;

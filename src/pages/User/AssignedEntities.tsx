import { Dialog, FormControl, Grid, IconButton, InputLabel, MenuItem, Select } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ControlPoint, Delete } from '@mui/icons-material';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomTabs, { CustomTab } from 'src/components/CustomTabs';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import RoleEngine from '../../components/Shared/RoleEngine';
import UserRoles from './UserRoles';
import { CustomDialogTransition } from 'src/constants/helpers';

export default function AssignedEntities({ entities, permissions, userId, onSuccess, loggedInUser, entityAccessIds = [], roleAccessIds = [] }) {
  const {
    state: {
      selectedEntity,
      user: { user }
    }
  } = useData();
  const [currentEntity, setCurrentEntity] = useState(entities[0]);
  const [unionRoleData, setUnionRoleData] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState<any>(0);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleRemoveConfirmBox, setRoleRemoveConfirmBox] = useState({ open: false, data: null });

  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (currentEntity?.entity || currentEntity?.role.length) {
      getRoleUnion();
    }
    // eslint-disable-next-line
  }, [currentEntity]);

  const handleUnassignRole = (value) => {
    let entityArray = [];
    if (entities) {
      entities.forEach((d) => {
        entityArray.push({
          entity: d.entity?._id,
          role: currentEntity?.entity._id === d.entity?._id ? d.role?.filter((d) => d._id !== value._id).map((r) => r._id) : d.role?.map((r) => r._id)
        });
      });
    }
    let dataObj = {
      user: userId,
      entities: entityArray
    };
    setIsSubmitting(true);
    axiosInstance()
      .put(`/user/assign-entity`, dataObj)
      .then(() => {
        toastConfig.setToastConfig({
          message: `${showConfirmBox ? 'Entity unassigned successfully.' : 'Role removed successfully'}`,
          type: 'success',
          open: true
        });
        setIsSubmitting(false);
        setRoleRemoveConfirmBox({ open: false, data: null });
        onSuccess();
      })
      .catch((error) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteEntity = () => {
    setShowConfirmBox(true);
  };

  const DeleteEntity = () => {
    let entityArray = [];
    if (entities) {
      entities.forEach((d) => {
        if (currentEntity.entity?._id !== d.entity?._id) {
          entityArray.push({
            entity: d.entity?._id,
            role: d.role?.map((r) => r._id)
          });
        }
      });
    }
    let dataObj = {
      user: userId,
      entities: entityArray
    };
    axiosInstance()
      .put(`/user/assign-entity`, dataObj)
      .then(() => {
        toastConfig.setToastConfig({
          message: `${showConfirmBox ? 'Entity unassigned successfully.' : 'Role removed successfully'}`,
          type: 'success',
          open: true
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleCloseDialog = () => {
    setShowAssignEntityDialog(false);
  };

  const handleAssignRole = (rec) => {
    setShowAssignEntityDialog(true);
  };
  const getRoleUnion = () => {
    axiosInstance()
      .get(`/user/entity-union-role/?userId=${userId}&entityId=${currentEntity?.entity?._id}`)
      .then(({ data: { data } }) => {
        setUnionRoleData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  return (
    <>
      {showAssignEntityDialog && (
        <Dialog
          fullScreen={isMobile || isTablet}
          fullWidth
          maxWidth="sm"
          TransitionComponent={CustomDialogTransition}
          open={showAssignEntityDialog}
          onClose={handleCloseDialog}
          aria-labelledby="assign-roles-dialog"
        >
          <AssignEntityDialog
            entitiesDialogOpen={showAssignEntityDialog}
            handleCloseDialog={handleCloseDialog}
            type="entity"
            ids={[userId, currentEntity?.entity._id]}
            assignedEntity={entities}
            regionalRole={true}
            onSuccess={() => {
              onSuccess();
            }}
            entityAccessIds={entityAccessIds}
            roleAccessIds={roleAccessIds}
          />
        </Dialog>
      )}
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to un-assign ${currentEntity?.entity?.entityName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={DeleteEntity}
        />
      ) : null}
      <BoxWithBorder
        style={{
          padding: '5px'
        }}
      >
        <Box>
          <>
            {isMobile || isTablet ? (
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel id="demo-simple-select-outlined-label">Select Entity</InputLabel>
                <Select
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  value={currentTabIndex}
                  onChange={(index, values: any) => {
                    const {
                      props: { value }
                    } = values;
                    setCurrentTabIndex(value);
                    setCurrentEntity(entities[value]);
                  }}
                  label="Section Name"
                  name="sectionName"
                >
                  {entities.map((c, i) => (
                    <MenuItem key={i} value={i}>
                      {c?.entity?.entityName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <CustomTabs
                variant="scrollable"
                scrollButtons="auto"
                value={currentTabIndex}
                onChange={(index, newValue) => {
                  setCurrentTabIndex(newValue);
                  setCurrentEntity(entities[newValue]);
                }}
              >
                {entities.map((c, i) =>
                  currentTabIndex === i ? (
                    <CustomTab key={i} value={i}>
                      {c?.entity?.entityName}
                      {permissions?.user?.isDelete && !Boolean(userId === user?._id && currentEntity?.entity?._id === selectedEntity) ? (
                        <IconButton aria-label="delete" size="small" className="ml-1" onClick={() => handleDeleteEntity()}>
                          <Delete color="error" />
                        </IconButton>
                      ) : null}
                    </CustomTab>
                  ) : (
                    <CustomTab key={i} value={i} label={c?.entity?.entityName} />
                  )
                )}
              </CustomTabs>
            )}

            <Box style={{ padding: '0px', minHeight: '300px' }}>
              <Box display="flex" padding={1} bgcolor="var(--dark-secondary, var(--accordion-expanded-summary-bg, #EFFBF9))">
                <Grid container>
                  <Grid item xs={10}>
                    <Box display="flex">
                      <Grid container>
                        <Grid item xs={4}>
                          <Typography variant="subtitle2">Assigned Roles ({currentEntity?.role?.length || '0'})</Typography>
                        </Grid>
                        <Grid item xs={8} justify="flex-start"></Grid>
                      </Grid>
                    </Box>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    {permissions?.user?.isUpdate && (
                      <IconButton color="primary" size="small" onClick={handleAssignRole}>
                        <ControlPoint />
                      </IconButton>
                    )}
                  </Grid>
                </Grid>
              </Box>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={12} md={4}>
                  <BoxWithBorder
                    style={{
                      padding: '0px',
                      height: '352px'
                    }}
                  >
                    {
                      <Box
                        style={{
                          height: '100%',
                          overflowY: 'auto'
                        }}
                      >
                        {currentEntity.role && (
                          <UserRoles
                            permissions={permissions}
                            data={currentEntity.role}
                            unassignRole={(data) => {
                              setRoleRemoveConfirmBox({ open: true, data: data });
                            }}
                          />
                        )}
                      </Box>
                    }
                  </BoxWithBorder>
                </Grid>
                <Grid item xs={12} sm={12} md={8} lg={8}>
                  <BoxWithBorder
                    style={{
                      padding: '0px',
                      height: '352px'
                    }}
                  >
                    <RoleEngine
                      field={unionRoleData ? unionRoleData.field : []}
                      resource={unionRoleData ? unionRoleData.resource : []}
                      isDisable={true}
                      setField={() => {}}
                      setResource={() => {}}
                    />
                  </BoxWithBorder>
                </Grid>
              </Grid>
            </Box>
          </>
        </Box>
        {roleRemoveConfirmBox.open && (
          <ConfirmationDialog
            open={roleRemoveConfirmBox.open}
            message={`Are you sure you want to unassign ${roleRemoveConfirmBox?.data?.name} ?`}
            onClose={() => {
              setRoleRemoveConfirmBox({ open: false, data: null });
            }}
            onOk={() => {
              handleUnassignRole(roleRemoveConfirmBox.data);
            }}
            okBtnLoading={isSubmitting}
          />
        )}
      </BoxWithBorder>
    </>
  );
}

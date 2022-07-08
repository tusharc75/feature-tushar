import { useContext, useEffect, useState } from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Dialog, FormControl, Grid, IconButton, InputLabel, MenuItem, Select } from '@material-ui/core';
import { ControlPoint, Delete } from '@material-ui/icons';
import BoxWithBorder from '../../components/BoxWithBorder';
import UserRoles from './UserRoles';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../StateProvider/Provider'
import RoleEngine from '../../components/Shared/RoleEngine';

export default function AssignedEntities({
  entities,
  permissions,
  userId,
  onSuccess,
  loggedInUser,
  entityAccessIds = [],
  roleAccessIds = [],
}) {
  const { state: { selectedEntity, user: { user } } } = useData()
  const [currentEntity, setCurrentEntity] = useState(entities[0]);
  const [unionRoleData, setUnionRoleData] = useState(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    if (currentEntity?.entity || currentEntity?.role.length) {
      getRoleUnion()
    }
    // eslint-disable-next-line
  }, [currentEntity]);

  const handleUnassignRole = (value) => {
    let entityArray = []
    if (entities) {
      entities.forEach(d => {
        entityArray.push({
          entity: d.entity?._id,
          role: currentEntity?.entity._id === d.entity?._id ? d.role?.filter(d => d._id !== value._id).map(r => r._id) : d.role?.map(r => r._id)
        })
      })
    }
    let dataObj = {
      user: userId,
      entities: entityArray
    };
    axiosInstance()
      .put(`/user/assign-entity`, dataObj)
      .then(() => {
        toastConfig.setToastConfig({
          message: `${showConfirmBox ? "Entity unassigned successfully." : "Role removed successfully"}`,
          type: "success",
          open: true,
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDeleteEntity = () => {
    setShowConfirmBox(true);
  };

  const DeleteEntity = () => {
    let entityArray = []
    if (entities) {
      entities.forEach(d => {
        if (currentEntity.entity?._id !== d.entity?._id) {
          entityArray.push({
            entity: d.entity?._id,
            role: d.role?.map(r => r._id)
          })
        }
      })
    }
    let dataObj = {
      user: userId,
      entities: entityArray
    };
    axiosInstance()
      .put(`/user/assign-entity`, dataObj)
      .then(() => {
        toastConfig.setToastConfig({
          message: `${showConfirmBox ? "Entity unassigned successfully." : "Role removed successfully"}`,
          type: "success",
          open: true,
        });
        onSuccess();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleCloseDialog = () => {
    setShowAssignEntityDialog(false)
  };

  const handleAssignRole = (rec) => {
    setShowAssignEntityDialog(true)

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
          fullWidth
          maxWidth="sm"
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
          message={`Are you sure you want to un-assign  ${currentEntity?.entity?.entityName} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={DeleteEntity}
        />
      ) : null}
      <BoxWithBorder
        style={{
          padding: "5px",
        }}
      >
        <Box>
          <>{
            isMobile || isTablet ?
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel id="demo-simple-select-outlined-label">Select Entity</InputLabel>
                <Select
                  labelId="demo-simple-select-outlined-label"
                  id="demo-simple-select-outlined"
                  value={currentTabIndex}
                  onChange={(index, values: any) => {
                    const { props: { value } } = values;
                    setCurrentTabIndex(value);
                    setCurrentEntity(entities[value])
                  }}
                  label="Section Name"
                  name="sectionName"
                >
                  {entities.map((c, i) => (
                    <MenuItem key={i} value={i}>{c?.entity?.entityName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              :
              <Tabs
                variant="scrollable"
                scrollButtons="auto"
                className="oms-tab"
                value={currentTabIndex}
                onChange={(index, newValue) => {
                  setCurrentTabIndex(newValue);
                  setCurrentEntity(entities[newValue])
                }}
                indicatorColor="primary"
                textColor="primary"
                aria-label="icon tabs example"
              >
                {entities.map((c, i) => (
                  currentTabIndex === i ?
                    <>
                      <Tab
                        key={i}
                        tabIndex={i}
                        label={c?.entity?.entityName}
                        aria-controls={`a11y-tabpanel-${i}`}
                        id={`a11y-tab-${i}`}
                      />
                      {permissions?.user?.isDelete && !Boolean(userId === user?._id && currentEntity?.entity?._id === selectedEntity) ? (
                        <IconButton aria-label="delete" onClick={() => handleDeleteEntity()}>
                          <Delete color="error" />
                        </IconButton>) : null}
                    </>
                    : <Tab
                      key={i}
                      tabIndex={i}
                      label={c?.entity?.entityName}
                      aria-controls={`a11y-tabpanel-${i}`}
                      id={`a11y-tab-${i}`}
                    />
                ))}
              </Tabs>
          }
            <Box style={{ padding: "0px", minHeight: "300px" }}>
              <Box display="flex" padding={1} bgcolor="grey.200">
                <Grid container>
                  <Grid item xs={10}>
                    <Box display="flex">
                      <Grid container>
                        <Grid item xs={4}>
                          <Typography variant="subtitle2">
                            Assigned Roles ({currentEntity?.role?.length || "0"})
                          </Typography>
                        </Grid>
                        <Grid item xs={8} justify="flex-start">

                        </Grid>
                      </Grid>

                    </Box>
                  </Grid>
                  <Grid item xs={2} container justify="flex-end">
                    {permissions?.user?.isUpdate && (
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={handleAssignRole}
                      >
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
                      padding: "0px",
                      height: "352px",
                    }}
                  >
                    {
                      <Box
                        style={{
                          height: "100%",
                          overflowY: "auto",
                        }}
                      >
                        {currentEntity.role && (
                          <UserRoles
                            permissions={permissions}
                            data={currentEntity.role}
                            unassignRole={handleUnassignRole}
                            loggedInUser={loggedInUser}
                            currentUserId={userId}

                          />
                        )}
                      </Box>

                    }
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
            </Box>
          </>
        </Box>
      </BoxWithBorder>
    </>
  );
}

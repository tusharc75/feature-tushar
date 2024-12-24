import { useEffect, useState } from 'react';
import { Dialog, Button, CircularProgress, Grid, Box, TextField, Paper, useTheme } from '@mui/material';
import { useHistory } from 'react-router-dom';
import { Autocomplete, Skeleton } from '@material-ui/lab';
import axiosInstance from '../../axios/axiosInstance';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import Loader from '../../components/Loader';
import RoleEngine from '../../components/Shared/RoleEngine';
import { CustomDialogTransition, ROLE_TIER, roleTypes } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isMobile, isTablet } from 'react-device-detect';
import { useData } from '../../StateProvider/Provider';
import ImportExportRole from 'src/pages/Role/ImportExportRole';

const CreateRole = ({ open, close, fetchData, roleType, setToastConfig, selectedEntity, isClone = false, roleId = null }) => {
  const {
    state: {
      user: { user }
    }
  } = useData();

  const history = useHistory();
  const [isSubmitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({ name: '', description: '', tier: ROLE_TIER.tier1 });
  const [cloneHeading, setCloneHeading] = useState('');
  const [field, setField] = useState([]);
  const [resource, setResource] = useState([]);
  const [childrenResource, setChildrenResource] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  useEffect(() => {
    if (isClone) {
      fetchRoleData();
    } else {
      getInitialData();
    }
  }, []);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/role/${roleId}`);
      setValues({ name: '', description: data.description, tier: data?.tier || ROLE_TIER.tier1 });
      setCloneHeading(data.name);
      setField(data.field);
      setResource(data.resource);
      setChildrenResource(data.childrenResource);
      setLoading(false);
    } catch (error) {
      setToastConfig(error);
    }
  };

  const getInitialData = () => {
    setLoading(true);
    let api =
      roleType === roleTypes.find((d) => d.key === 'Global')?.value
        ? `/field?resource=Role&roleType=${roleType}`
        : `/field?resource=Role&roleType=${roleType}&entity=${selectedEntity}`;
    axiosInstance()
      .get(`user/entity-union-role/?userId=${user?._id}&entityId=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const oldData = { ...data };
        const field = data.field.map((f: any) => ({
          ...f,
          isCreate: false,
          isRead: false,
          isUpdate: false,
          isCreateDisabled: !f.isCreate,
          isReadDisabled: !f.isRead,
          isUpdateDisabled: !f.isUpdate
        }));
        const resource = data.resource.map((r: any) => ({
          ...r,
          isCreate: false,
          isCreateDisabled: !r.isCreate,
          isDelete: false,
          isDeleteDisabled: !r.isDelete,
          isRead: false,
          isReadDisabled: !r.isRead,
          isUpdate: false,
          isUpdateDisabled: !r.isUpdate
        }));
        const childrenResource = data.childrenResource.map((r: any) => ({
          ...r,
          isCreate: false,
          isCreateDisabled: !r.isCreate,
          isDelete: false,
          isDeleteDisabled: !r.isDelete,
          isRead: false,
          isReadDisabled: !r.isRead,
          isUpdate: false,
          isUpdateDisabled: !r.isUpdate
        }));
        setField(field);
        setResource(resource);
        setChildrenResource(childrenResource);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
  };

  const handleSubmit = () => {
    if (
      resource.some((d) => d.isCreate || d.isRead || d.isUpdate || d.isDelete) ||
      field.some((d) => d.isCreate || d.isRead || d.isUpdate || d.isDelete)
    ) {
      const resources = resource.map((r) => {
        const newData = { ...r };
        delete newData.isReadDisabled;
        delete newData.isUpdateDisabled;
        delete newData.isCreateDisabled;
        delete newData.isDeleteDisabled;
        delete newData.isHiddenDisabled;
        return newData;
      });
      const fields = field.map((f) => {
        const newData = { ...f };
        delete newData.isReadDisabled;
        delete newData.isUpdateDisabled;
        delete newData.isCreateDisabled;
        delete newData.isDeleteDisabled;
        delete newData.isHiddenDisabled;
        delete newData.isHidden;
        return newData;
      });
      setSubmitting(true);
      axiosInstance()
        .post('/role', {
          ...values,
          field: fields,
          resource: resources,
          type: roleType
        })
        .then(({ data }) => {
          const newId = data.data._id;
          fetchData();
          setSubmitting(false);
          history.push(`/role/detail/${newId}`);
          close();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      setToastConfig({
        open: true,
        type: 'error',
        message: 'Please check atleast one permission'
      });
    }
  };

  const updateChildResource = (resource, access, checked) => {
    const toUpdateResource = [...childrenResource];
    const newField = [...field];
    toUpdateResource?.forEach((ele) => {
      if (ele.parentResource === resource) {
        ele[access] = checked;
        if (checked) {
          ele['isRead'] = checked;
        }
        if (['isRead', 'isCreate', 'isUpdate']?.includes(access)) {
          const childResourceFields = newField.filter((_field) => _field.fieldData.resource === ele.name);
          childResourceFields?.forEach((_field) => {
            _field[access] = checked;
            if (access === 'isCreate' || access === 'isUpdate') {
              if (checked) {
                _field['isRead'] = checked;
              }
            }
          });
        }
      }
    });
    setChildrenResource(toUpdateResource);
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      fullWidth
      fullScreen={fullScreen || isMobile || isTablet}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <CustomDialogHeader
        title={isClone ? `Clone Role - [${cloneHeading}]` : 'Create New Role'}
        onClose={() => setShowConfirmDialog(true)}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      {loading ? (
        <>
          <CustomDialogContent>
            <Skeleton width="100%" height="70px" />
            <Grid container spacing={2}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Grid key={i} item xs={12} sm={6} md={6}>
                  <Skeleton width="100%" height="60px" />
                </Grid>
              ))}
            </Grid>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button variant="outlined" size="small" color="primary" disabled={loading}>
              Cancel
            </Button>
            <Button variant="contained" size="small" color="primary" disabled={loading}>
              Submit
            </Button>
          </CustomDialogFooter>
        </>
      ) : (
        <>
          <CustomDialogContent>
            <Box paddingX={1} paddingY={2}>
              <Box className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                <TextField
                  required
                  variant="outlined"
                  size="small"
                  fullWidth
                  label="Role Name"
                  value={values.name}
                  onChange={(e) => setValues({ ...values, name: e.target.value.trimStart() })}
                />
                <TextField
                  required
                  variant="outlined"
                  multiline
                  size="small"
                  fullWidth
                  label="Role Description"
                  value={values.description}
                  onChange={(e) => setValues({ ...values, description: e.target.value.trimStart() })}
                />
                <Autocomplete
                  id={`roleTier`}
                  options={Object.values(ROLE_TIER)}
                  autoHighlight
                  disableClearable
                  fullWidth
                  renderOption={(option) => option || ''}
                  onChange={(event: any, newValue: any) => {
                    setValues({ ...values, tier: newValue });
                  }}
                  getOptionLabel={(option) => option || ''}
                  value={values?.tier}
                  renderInput={(params) => <TextField {...params} required label="Select Tier" margin="none" size="small" variant="outlined" />}
                />
              </Box>
              <Box className="mb-3 flex justify-end">
                <ImportExportRole
                  resource={resource}
                  field={field}
                  childrenResource={childrenResource}
                  setField={setField}
                  setResource={setResource}
                  setChildrenResource={setChildrenResource}
                  isExport={false}
                  isImport={true}
                />
              </Box>
              <Paper>
                {loading ? (
                  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 200 }}>
                    <Loader style={{ height: '100%' }} text="Loading..." />
                  </div>
                ) : (
                  field.length && (
                    <>
                      {resource.length && (
                        <RoleEngine
                          style={{
                            height: fullScreen || isMobile || isTablet ? `calc(100vh - 200px)` : '500px'
                          }}
                          field={field}
                          resource={resource}
                          updateChildResource={updateChildResource}
                          setField={setField}
                          setResource={setResource}
                          tier={values?.tier}
                        />
                      )}
                      {childrenResource.length && (
                        <Box mt={2}>
                          <RoleEngine
                            style={{
                              height: fullScreen || isMobile || isTablet ? `calc(100vh - 200px)` : '500px'
                            }}
                            field={field}
                            resource={childrenResource?.map((e, index) => {
                              return { ...e, resourceId: index };
                            })}
                            setField={setField}
                            setResource={setChildrenResource}
                            tier={ROLE_TIER.tier1}
                            child={true}
                          />
                        </Box>
                      )}
                    </>
                  )
                )}
              </Paper>
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={isSubmitting}
              onClick={() => {
                if ((Boolean(!values.name) && Boolean(!values.description)) || Boolean(!values.tier)) close();
                else setShowConfirmDialog(true);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSubmit}
              disabled={isSubmitting || Boolean(!values.name) || Boolean(!values.description) || Boolean(!values.tier)}
            >
              {isSubmitting ? <CircularProgress size={22} /> : 'Submit'}
            </Button>
          </CustomDialogFooter>
          {showConfirmDialog ? (
            <ConfirmCancelDialog
              close={() => setShowConfirmDialog(false)}
              open={showConfirmDialog}
              onSave={() => {
                setShowConfirmDialog(false);
                handleSubmit();
              }}
              onClose={() => {
                setShowConfirmDialog(false);
                close();
              }}
            />
          ) : null}
        </>
      )}
    </Dialog>
  );
};

export default CreateRole;

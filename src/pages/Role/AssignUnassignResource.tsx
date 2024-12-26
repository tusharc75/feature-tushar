import { useState, useEffect } from 'react';
import { Button, Checkbox, CircularProgress, Dialog, TextField, FormControlLabel, Box } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import Loader from '../../components/Loader';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { CustomDialogTransition } from 'src/constants/helpers';

const AssignUnassignResourceDialog = ({
  showUpdateResourceDialog,
  handleCloseDialog,
  roleIds,
  onSuccess,
  selectedEntity,
  roleType,
  setToastConfig
}) => {
  const [resource, setResource] = useState([]);
  const [selectedResource, setSelectedResource] = useState([]);
  const [access, setAccess] = useState({ Read: true, Create: true, Update: true, Delete: true });
  const {
    state: {
      user: { user }
    }
  } = useData();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {
    setLoading(true);
    axiosInstance()
      .get(`user/entity-union-role/?userId=${user?._id}&entityId=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const resource = data.resource.map((r: any) => ({
          ...r,
          isRead: false,
          isCreate: false,
          isUpdate: false,
          isDelete: false
        }));
        setResource(resource);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
  };

  const handleUpdate = async () => {
    if ((access.Read || access.Create || access.Update || access.Delete) && selectedResource.length) {
      let resources = [];
      resource.forEach((r) => {
        if (selectedResource.includes(r.name)) {
          let newData = { ...r };
          newData.isRead = access.Read;
          newData.isCreate = access.Create;
          newData.isUpdate = access.Update;
          newData.isDelete = access.Delete;
          if (showUpdateResourceDialog?.action === 'Remove') {
            newData.isRead = false;
            newData.isCreate = false;
            newData.isUpdate = false;
            newData.isDelete = false;
          }
          resources.push(newData);
        }
      });
      setSubmitting(true);
      axiosInstance()
        .put('/role/assign-unassign-resources', {
          resource: resources,
          type: roleType,
          roleIds: roleIds
        })
        .then(({ data }) => {
          setSubmitting(false);
          setSelectedResource([]);
          handleClose();
          setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
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

  const handleClose = () => {
    setSelectedResource([]);
    setAccess({ Read: true, Create: true, Update: true, Delete: true });
    handleCloseDialog();
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      TransitionComponent={CustomDialogTransition}
      open={showUpdateResourceDialog?.open}
      onClose={handleClose}
      aria-labelledby="assign-resource-dialog"
    >
      <CustomDialogHeader title={showUpdateResourceDialog?.action + ' Resources'} onClose={handleClose} />
      <CustomDialogContent>
        {isSubmitting ? (
          <Loader />
        ) : (
          <Box>
            <Autocomplete
              id="select-resources"
              // style={{ width: '400px' }}
              multiple={true}
              options={resource?.map((_resource) => _resource.name)}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Resource" margin="dense" size="small" required={true} />}
              getOptionLabel={(option) => option}
              onChange={(e, val) => {
                setSelectedResource(val);
              }}
            />
          </Box>
        )}
        {showUpdateResourceDialog?.action === 'Assign' ? (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  name="Read"
                  checked={access.Read}
                  onChange={(e) => {
                    setAccess({ ...access, Read: e.target.checked, Create: e.target.checked, Update: e.target.checked, Delete: e.target.checked });
                  }}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Read"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="Create"
                  checked={access.Create}
                  onChange={(e) => {
                    setAccess({ ...access, Create: e.target.checked, Read: e.target.checked ? true : access.Read });
                  }}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Create"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="Update"
                  checked={access.Update}
                  onChange={(e) => {
                    setAccess({ ...access, Update: e.target.checked, Read: e.target.checked ? true : access.Read });
                  }}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Update"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="Delete"
                  checked={access.Delete}
                  onChange={(e) => {
                    setAccess({ ...access, Delete: e.target.checked, Read: e.target.checked ? true : access.Read });
                  }}
                  color="primary"
                  disabled={isSubmitting}
                />
              }
              label="Delete"
            />
          </Box>
        ) : null}
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button disabled={isSubmitting} onClick={handleClose} color="primary" size="small">
          Cancel
        </Button>
        <Button disabled={!selectedResource.length || isSubmitting} onClick={handleUpdate} color="primary" size="small" variant="contained">
          {isSubmitting ? <CircularProgress size={22} /> : 'Save'}
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
};

export default AssignUnassignResourceDialog;

import { useState, useEffect } from 'react';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  TextField,
  FormControlLabel,
  Box
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CustomDialogContent from '../../components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from '../../components/CustomDialog/CustomDialogHeader';
import Loader from '../../components/Loader';
import CustomDialogFooter from '../../components/CustomDialog/CustomDialogFooter';
import axiosInstance from '../../axios/axiosInstance';
import {useData} from '../../StateProvider/Provider'


const UpdateResourceDialog = ({ showUpdateResourceDialog, handleCloseDialog, roleIds, onSuccess,  selectedEntity, roleType, setToastConfig}) => {
  const [resource, setResource] = useState([]);
  const [selectedResource, setSelectedResource] = useState([]);
  const [access, setAccess] = useState({Read: true, Create: true, Update: true, Delete: true});
  const {state : {user: { user }}} = useData();
  const [loading, setLoading] = useState(false);
  const [field, setField] = useState([]);
  const [isSubmitting, setSubmitting] = useState(false);
  

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = () => {    
    setLoading(true);
    axiosInstance()
      .get(`user/entity-union-role/?userId=${user?._id}&entityId=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const oldData = {...data}
        const field = data.field.map(((f:any) => ({
          ...f,
          isCreate: false,
          isRead: false,
          isUpdate: false,
          isCreateDisabled: !f.isCreate,
          isReadDisabled: !f.isRead,
          isUpdateDisabled: !f.isUpdate,
        })))
        const resource = data.resource.map((r:any) => ({
          ...r,
          isCreate: false,
          isCreateDisabled: !r.isCreate,
          isDelete: false,
          isDeleteDisabled: !r.isDelete,
          isRead: false,
          isReadDisabled: !r.isRead,
          isUpdate: false,
          isUpdateDisabled: !r.isUpdate,
        }))
        setField(field);
        setResource(resource);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        setToastConfig(err);
      });
  };


  const handleUpdate = async () => {
    if ( (access.Read || access.Create || access.Update || access.Delete) && selectedResource.length){
      const resources = resource.map((r) => {
        let newData = {...r}
        delete newData.isReadDisabled
        delete newData.isCreateDisabled
        delete newData.isUpdateDisabled
        delete newData.isDeleteDisabled
        if(selectedResource.includes(r.name)){
          newData.isRead = access.Read
          newData.isCreate = access.Create
          newData.isUpdate = access.Update
          newData.isDelete = access.Delete
          if(showUpdateResourceDialog?.action === 'Remove'){
            newData.isRead = false
            newData.isCreate = false
            newData.isUpdate = false
            newData.isDelete = false
          }
          return newData;
        }
        return newData;
      });
      const fields = field.map((f) => {
        let newData = {...f}
        delete newData.isReadDisabled
        delete newData.isCreateDisabled
        delete newData.isUpdateDisabled
        if(selectedResource.includes(f?.fieldData?.resource)){
          newData.isRead = access.Read
          newData.isCreate = access.Create
          newData.isUpdate = access.Update
          if(showUpdateResourceDialog?.action === 'Remove'){
            newData.isRead = false
            newData.isCreate = false
            newData.isUpdate = false
          }
          return newData;
        }
        return newData;
      });
      setSubmitting(true);
      axiosInstance()
        .put("/role/update-resources", {
          field: fields,
          resource: resources,
          type: roleType,
          roleIds: roleIds,
        })
        .then(({ data }) => {        
          setSubmitting(false);
          setSelectedResource([]);  
          handleClose();
        })
        .catch((err) => {
          setSubmitting(false);
          setToastConfig(err);
        });
    } else {
      setToastConfig({
        open: true,
        type: "error",
        message: "Please check atleast one permission",
      });
    }
  };

  const handleClose = () => {
    setSelectedResource([]);
    setAccess({Read: true, Create: true, Update: true, Delete: true});
    handleCloseDialog();
  }

  return (
    <Dialog fullWidth maxWidth="md" open={showUpdateResourceDialog?.open} onClose={handleClose} aria-labelledby="assign-resource-dialog">
      <CustomDialogHeader title={showUpdateResourceDialog?.action + " Resources"  } onClose={handleClose}/>
      <CustomDialogContent>
        { isSubmitting ?  (
          <Loader />
          ) :(
          <Box >
              <Autocomplete
                id="select-resources"
                // style={{ width: '400px' }}
                multiple={true}
                options={resource?.map((_resource) => _resource.name)}
                renderInput={(params) =>
                  <TextField {...params}
                    variant="outlined"
                    label="Resource"
                    margin="dense"
                    required={true} />}
                getOptionLabel={(option) => option}
                onChange={(e, val) => {
                  setSelectedResource(val);
                }}
              />
            </Box>
          )}
          { showUpdateResourceDialog?.action === "Assign" ? (
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
        ): null}
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

export default UpdateResourceDialog;

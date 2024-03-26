import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid, IconButton, TextField, Typography } from '@material-ui/core';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import { Autocomplete } from '@material-ui/lab';
import { getLookupResource, getResourceField } from '../helper';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

export default function Action({ onClose, onSuccess, resource, resourceData }) {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [createAction, setCreateAction] = useState([]);
  const [resourceOption, setResourceOption] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getResource();
  }, []);

  const getResource = async () => {
    const lookupResource = await getLookupResource();
    setResourceOption(lookupResource);
  };

  useEffect(() => {
    setCreateAction(resourceData?.createAction || []);
  }, [resourceData]);

  const addRemove = (action = 'create', type, index) => {
    if (action === 'create') {
      let data = createAction;
      if (type === 'add') {
        data.splice(index, 0, {
          resource: '',
          field: '',
          action: ''
        });
      } else {
        data.splice(index, 1);
      }
      setCreateAction([...data]);
    }
  };

  const handleSave = () => {
    setSubmitting(true);
    axiosInstance()
      .put(`/sa-formbuilder/steps/action/${resource}`, { createAction })
      .then(({ data }) => {
        setSubmitting(false);
        onSuccess();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((error) => {
        setSubmitting(false);
        toastConfig.setToastConfig(error);
      });
  };

  const validate = () => {
    let err: any = [];
    createAction?.forEach((action, i) => {
      if (!action?.resource) {
        err.push({ name: 'resource', index: i, error: 'Required Field', actionType: 'create' });
      }
      if (!action?.field) {
        err.push({ name: 'field', index: i, error: 'Required Field', actionType: 'create' });
      }
      if (!action?.action) {
        err.push({ name: 'action', index: i, error: 'Required Field', actionType: 'create' });
      }
    });
    setError(err);
    return err;
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
        }
      }}
    >
      <CustomDialogHeader
        onClose={onClose}
        title={'Action'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <CustomDialogContent>
        <Box>
          <Box>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
              <Box>
                <Typography variant="body2">Create Action</Typography>
              </Box>
              <Box>
                <IconButton size="small" aria-label="setting" onClick={() => addRemove('create', 'add', createAction?.length)}>
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
            <Box border={1} mt={1} borderColor="var(--common-border-color)" pb={10}>
              {createAction?.map((action, index) => (
                <Card
                  resource={resourceOption}
                  action={action}
                  state={createAction}
                  setState={setCreateAction}
                  index={index}
                  addRemove={addRemove}
                  actionType={'create'}
                  error={error}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" color="primary" disabled={submitting} onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={submitting}
          variant="contained"
          color="primary"
          size="small"
          type="submit"
          onClick={() => {
            const err: any = validate();
            if (!err?.length) {
              handleSave();
            }
          }}
          endIcon={submitting && <CircularProgress color="inherit" size={18} />}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

const Card = ({ resource, action, state, setState, index, addRemove, actionType, error }) => {
  const ACTION = [
    {
      optionLabel: 'Set Date',
      optionValue: 'setDate'
    }
  ];
  const [resourceFields, setResourceFields] = useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = useState(false);

  useEffect(() => {
    if (action?.resource) {
      getFields();
    }
  }, [action?.resource]);

  const getFields = async () => {
    setResourceFieldsLoading(true);
    try {
      const data: any = await getResourceField(action?.resource);
      setResourceFields(data);
      setResourceFieldsLoading(false);
    } catch (e) {
      setResourceFieldsLoading(false);
    }
  };

  return (
    <Box p={1} border={1} borderColor="var(--common-border-color)" mb={1} display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
      <Box width={'94%'}>
        <Grid container spacing={2}>
          <Grid item sm={4} md={4} lg={4}>
            <Autocomplete
              id="resource"
              options={resource}
              getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                resource && resource?.filter((data) => data.optionValue === action?.resource)?.length
                  ? resource && resource?.filter((data) => data.optionValue === action?.resource)[0]
                  : ''
              }
              onChange={(e: any, value) => {
                let data = [...state];
                data[index].resource = value && value?.optionValue ? value.optionValue : '';
                setState([...data]);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Resource"
                  placeholder="Resource"
                  name="resource"
                  required
                  error={Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resource')?.error)}
                  helperText={
                    Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resource')?.error) &&
                    error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resource')?.error
                  }
                />
              )}
            />
          </Grid>
          <Grid item sm={4} md={4} lg={4}>
            <Autocomplete
              id="resourceField"
              options={resourceFields}
              disabled={resourceFieldsLoading}
              getOptionLabel={(option: any) => (option ? option?.fieldLabel : '')}
              getOptionSelected={(option: any, val) => option?.fieldName === val}
              value={
                resourceFields && resourceFields.filter((data) => data?.fieldName === action?.field).length
                  ? resourceFields && resourceFields.filter((data) => data?.fieldName === action?.field)[0]
                  : ''
              }
              onChange={(e, val) => {
                let data = [...state];
                data[index].field = val && val?.fieldName ? val?.fieldName : '';
                setState([...data]);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Field"
                  placeholder="Field"
                  name="field"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <Fragment>
                        {resourceFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </Fragment>
                    )
                  }}
                  error={Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'field')?.error)}
                  helperText={
                    Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'field')?.error) &&
                    error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'field')?.error
                  }
                />
              )}
            />
          </Grid>
          <Grid item sm={4} md={4} lg={4}>
            <Autocomplete
              id="action"
              options={ACTION}
              getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
              getOptionSelected={(option: any, val) => option.optionValue === val}
              value={
                ACTION && ACTION?.filter((data) => data.optionValue === action?.action)?.length
                  ? ACTION && ACTION?.filter((data) => data.optionValue === action?.action)[0]
                  : ''
              }
              onChange={(e: any, value) => {
                let data = [...state];
                data[index].action = value && value?.optionValue ? value.optionValue : '';
                setState([...data]);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  variant="outlined"
                  label="Action"
                  placeholder="Action"
                  name="action"
                  required
                  error={Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'action')?.error)}
                  helperText={
                    Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'action')?.error) &&
                    error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'action')?.error
                  }
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>
      <Box>
        <IconButton aria-label="setting" onClick={() => addRemove(actionType, 'remove', index)}>
          <RemoveCircleOutlineIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

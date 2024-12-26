import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Dialog, Grid, IconButton, TextField, Typography } from '@mui/material';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition } from 'src/constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import Autocomplete from '@mui/material/Autocomplete';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

export default function Actions({ resource, onClose, onSuccess, stepData }) {
  const toastConfig = useContext(CustomToastContext);

  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [createActions, setCreateActions] = useState([]);
  const [error, setError] = useState(null);
  const [resourceFields, setResourceFields] = useState([]);
  const [resourceFieldsLoading, setResourceFieldsLoading] = useState(false);

  const fetchResourceFields = async () => {
    setResourceFieldsLoading(true);
    await axiosInstance()
      .get(`/field?resource=${resource}&view=false`)
      .then(({ data }) => {
        setResourceFields(data?.data?.map(({ fieldData }) => fieldData));
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
    setResourceFieldsLoading(false);
  };

  useEffect(() => {
    fetchResourceFields();
  }, [resource]);

  useEffect(() => {
    setCreateActions(stepData?.createActions || []);
  }, [stepData]);

  const addRemove = (action = 'create', type, index) => {
    if (action === 'create') {
      let data = createActions;
      if (type === 'add') {
        data.splice(index, 0, {
          resourceField: '',
          formField: ''
        });
      } else {
        data.splice(index, 1);
      }
      setCreateActions([...data]);
    }
  };

  const validate = () => {
    let err: any = [];
    createActions?.forEach((action, i) => {
      if (!action?.formField) {
        err.push({ name: 'formField', index: i, error: 'Required Field', actionType: 'create' });
      }
      if (!action?.resourceField) {
        err.push({ name: 'resourceField', index: i, error: 'Required Field', actionType: 'create' });
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
        title={'Step Actions'}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
        showRequiredLabel={false}
      />
      <CustomDialogContent>
        <Box border={1} p={2} borderColor="var(--common-border-color)">
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
            <Box>
              <Typography variant="subtitle2">Create Actions</Typography>
            </Box>
            <Box>
              <HtmlTooltip title="Add">
                <IconButton size="small" aria-label="setting" onClick={() => addRemove('create', 'add', createActions?.length)}>
                  <AddCircleOutlineIcon color="primary" fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Box>
          </Box>
          {createActions?.map((action, index) => (
            <Card
              state={createActions}
              setState={setCreateActions}
              index={index}
              addRemove={addRemove}
              actionType={'create'}
              error={error}
              fields={stepData?.fields}
              resourceFields={resourceFields}
              resourceFieldsLoading={resourceFieldsLoading}
            />
          ))}
        </Box>
      </CustomDialogContent>
      <CustomDialogFooter>
        <Button size="small" color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          type="submit"
          onClick={() => {
            const err: any = validate();
            if (!err?.length) {
              onSuccess(createActions);
            }
          }}
        >
          Save
        </Button>
      </CustomDialogFooter>
    </Dialog>
  );
}

const Card = ({ state, setState, index, addRemove, actionType, error, fields, resourceFields, resourceFieldsLoading }) => {
  const [resourceFieldOptions, setResourceFieldOptions] = useState([]);

  useEffect(() => {
    if (state[index]?.formField) {
      const fieldType = fields?.find((f) => f.fieldName === state[index]?.formField)?.type;
      setResourceFieldOptions(resourceFields?.filter((f) => f?.type === fieldType));
    }
  }, [state[index]?.formField, resourceFields]);

  return (
    <>
      <Box
        p={1}
        border={1}
        borderColor="var(--common-border-color)"
        mb={1}
        mt={1}
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        <Box width={'94%'}>
          <Grid container spacing={2}>
            <Grid item sm={6} md={6} lg={6}>
              <Autocomplete
                id="formField"
                options={fields}
                getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                value={fields?.find((f) => f.fieldName === state[index]?.formField) || ''}
                onChange={(e: any, value) => {
                  let data = [...state];
                  data[index].formField = value?.fieldName || '';
                  setState([...data]);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    variant="outlined"
                    label="Form Field"
                    placeholder="Form Field"
                    name="formField"
                    required
                    error={Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'formField')?.error)}
                    helperText={
                      Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'formField')?.error) &&
                      error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'formField')?.error
                    }
                  />
                )}
              />
            </Grid>
            <Grid item sm={6} md={6} lg={6}>
              <Autocomplete
                id="resourceField"
                options={resourceFieldOptions}
                getOptionLabel={(option: any) => (option ? option?.fieldLabel || '' : '')}
                isOptionEqualToValue={(option: any, val) => option?.fieldName === val}
                value={resourceFieldOptions?.find((f) => f.fieldName === state[index]?.resourceField) || ''}
                onChange={(e: any, value) => {
                  let data = [...state];
                  data[index].resourceField = value?.fieldName || '';
                  setState([...data]);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    size="small"
                    variant="outlined"
                    label="Resource Field"
                    placeholder="Resource Field"
                    name="resourceField"
                    required
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <Fragment>
                            {resourceFieldsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </Fragment>
                        )
                      }
                    }}
                    error={Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resourceField')?.error)}
                    helperText={
                      Boolean(error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resourceField')?.error) &&
                      error?.find((e) => e?.index === index && e?.actionType === actionType && e?.name === 'resourceField')?.error
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
        <Box>
          <HtmlTooltip title="Remove">
            <IconButton aria-label="setting" onClick={() => addRemove(actionType, 'remove', index)}>
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        </Box>
      </Box>
    </>
  );
};

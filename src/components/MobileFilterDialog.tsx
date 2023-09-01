import { Box, Button, Dialog, IconButton } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import { Add, HighlightOff } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import * as React from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import SaveFilterDialog from 'src/components/GridFilter/SaveFilterDialog';
import { v4 as uuidv4 } from 'uuid';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext';
import { isObjectEmpty } from '../constants/helpers';

import axiosInstance from 'src/axios/axiosInstance';
import './MobileFilterDialog.scss';

// const Transition = React.forwardRef(function Transition(
//   props: TransitionProps & {
//     children: React.ReactElement<any, any>;
//   },
//   ref: React.Ref<unknown>
// ) {
//   return <Slide direction="up" ref={ref} {...props} />;
// });

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, columns, dispatch, filters, title, resource = '' }) {
  const toastConfig = React.useContext(CustomToastContext);
  const [inputFields, setInputFields] = React.useState(null);
  const [userFilters, setUserFilters] = React.useState(null);
  const [isSaveFilter, setIsSaveFilter] = React.useState({ open: false, data: null });
  const [formValues, setFormValues] = React.useState({});
  const [selectedUserFilter, setSelectedUserFilter] = React.useState(null);

  React.useEffect(() => {
    if (!isObjectEmpty(filters)) {
      const data = [];
      Object.keys(filters).forEach((field) => {
        data.push({
          id: uuidv4(),
          fieldName: field,
          fieldValue: filters[field].filter
        });
      });
      setInputFields(data);
    } else {
      setInputFields([]);
    }
  }, [filters, isOpen]);

  const fetchUserFilters = React.useCallback(() => {
    axiosInstance()
      .get(`/user-resource-filter?resource=${resource}`)
      .then(({ data: { data } }) => {
        setUserFilters(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }, [resource, toastConfig]);

  React.useEffect(() => {
    if (resource && resource !== '' && isOpen) {
      fetchUserFilters();
    }
  }, [resource, fetchUserFilters, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    var result = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== '') {
        result[v.fieldName] = { filter: v.fieldValue };
      }
    });
    dispatch({ type: 'filter', filters: result });
    toastConfig.setToastConfig({
      open: true,
      type: 'success',
      message: 'Filtered Successfully'
    });
    handleClose();
    setInputFields([]);
  };

  const handleChangeInput = (id, event) => {
    const newInputFields = inputFields?.map((i) => {
      if (id === i.id) {
        i['fieldValue'] = event.target.value;
      }
      return i;
    });
    setInputFields(newInputFields);
  };

  const handleChangeAutocomplete = (id, value) => {
    const newInputFields = inputFields?.map((i) => {
      if (id === i.id) {
        i.fieldName = value?.field;
      }
      return i;
    });
    setInputFields(newInputFields);
  };

  const handleAddFields = () => {
    setInputFields([...inputFields, { id: uuidv4(), fieldName: '', fieldValue: '' }]);
  };

  const handleRemoveFields = (id) => {
    const values = [...inputFields];
    values.splice(
      values.findIndex((value) => value.id === id),
      1
    );
    setInputFields(values);
  };

  React.useEffect(() => {
    if (formValues) {
      const data = [];
      Object.keys(formValues).forEach((field) => {
        data.push({
          id: uuidv4(),
          fieldName: field,
          fieldValue: formValues[field]
        });
      });
      setInputFields(data);
    }
  }, [formValues]);

  const openSaveFilterModal = (e) => {
    e.preventDefault();
    var result = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== '') {
        result[v.fieldName] = v.fieldValue;
      }
    });
    setFormValues(result);
    setIsSaveFilter({ open: true, data: selectedUserFilter });
  };

  return (
    <>
      <Dialog
        open={isOpen}
        keepMounted
        onClose={handleClose}
        fullWidth
        aria-describedby="alert-dialog-slide-description"
        maxWidth="md"
        PaperProps={{
          style: { margin: 0, width: 'calc(100% - 26px)' }
        }}
      >
        <CustomDialogHeader title={title ? `${title} Filters` : `Filters`} onClose={handleClose} showRequiredLabel={false} />
        <form onSubmit={handleSubmit}>
          <CustomDialogContent style={{ maxHeight: '450px', overflow: 'auto' }}>
            <div className="grid gap-4 pb-[8px]">
              {contentPart && <div>{contentPart}</div>}
              {resource && resource !== '' && (
                <Box>
                  <Autocomplete
                    id={`select-saved-filter`}
                    options={userFilters || {}}
                    autoHighlight
                    renderOption={(option) => option?.title}
                    onChange={(event: any, newValue: any) => {
                      setSelectedUserFilter(newValue || null);
                      setFormValues(newValue?.filterValue || {});
                    }}
                    getOptionLabel={(option) => option.title}
                    value={selectedUserFilter || {}}
                    renderInput={(params) => <TextField {...params} label="Select a Filter Set" margin="none" size="small" variant="outlined" />}
                  />
                </Box>
              )}
              {inputFields?.map((field) => (
                <Box key={field.id}>
                  <Box
                    p={1}
                    className="shadow-[0px_5.44444px_27.22222px_0px_rgba(0,_0,_0,_0.06)] border-1 border border-[var(--common-border-color)] rounded-md"
                  >
                    <Box display="flex" alignItems={'center'}>
                      <Box flexGrow={1}>
                        <Autocomplete
                          id={`fieldName_${field.id}`}
                          options={columns}
                          autoHighlight
                          getOptionLabel={(option: any) => option?.headerName}
                          renderOption={(option) => option?.headerName}
                          onChange={(event, value) => {
                            if (value !== null) {
                              handleChangeAutocomplete(field.id, value);
                            } else {
                              handleChangeAutocomplete(field.id, '');
                            }
                          }}
                          value={columns?.find((v) => v.field === field?.fieldName) || {}}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              name={`fieldName_${field.id}`}
                              label="Select Field"
                              margin="none"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        />
                      </Box>
                      <Box ml={1}>
                        <IconButton aria-label="delete" size="small" onClick={() => handleRemoveFields(field.id)}>
                          <HighlightOff color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                    <TextField
                      name={`fieldValue_${field.id}`}
                      label="Filter Text"
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      value={field.fieldValue}
                      onChange={(event) => handleChangeInput(field.id, event)}
                    />
                  </Box>
                </Box>
              ))}
              <Box>
                <IconButton
                  color="primary"
                  size="small"
                  style={{ background: 'var(--primary)', color: 'white', borderRadius: '100vmax' }}
                  onClick={handleAddFields}
                >
                  <Add />
                </IconButton>
              </Box>
            </div>
          </CustomDialogContent>
          <CustomDialogFooter>
            {resource && resource !== '' && (
              <Button
                type="button"
                className="no-shadow yellow-button"
                disabled={inputFields?.length === 0 || inputFields?.some((v) => v.fieldValue === '' || v.fieldName === '')}
                size="small"
                variant="contained"
                onClick={openSaveFilterModal}
              >
                Save Filter
              </Button>
            )}
            <Button type="submit" className="no-shadow" color="primary" size="small" variant="contained" onClick={handleSubmit}>
              Apply Now
            </Button>
          </CustomDialogFooter>
        </form>
      </Dialog>
      {isSaveFilter.open && resource && resource !== '' && (
        <SaveFilterDialog
          handleClose={() => {
            setIsSaveFilter({ open: false, data: null });
          }}
          resource={resource}
          handleSucess={() => {
            setIsSaveFilter({ open: false, data: null });
            setFormValues({});
            fetchUserFilters();
            setSelectedUserFilter(null);
          }}
          filterData={isSaveFilter.data}
          filterValue={formValues}
        />
      )}
    </>
  );
}

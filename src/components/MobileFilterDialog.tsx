import { Box, Button, Dialog, IconButton } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import { Add, HighlightOff, Close } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import * as React from 'react';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import SaveFilterDialog from 'src/components/GridFilter/SaveFilterDialog';
import { v4 as uuidv4 } from 'uuid';
import { CustomToastContext } from '../StateProvider/CustomToastContext/CustomToastContext';
import { isObjectEmpty } from '../constants/helpers';
import lodash from 'lodash';
import { useLocation } from 'react-router-dom';

import axiosInstance from 'src/axios/axiosInstance';
import './MobileFilterDialog.scss';
import { useStore, MOBILE_FILTER_FORM_DATA, MOBILE_USER_FILTER, MOBILE_FILTER_MODEL, MOBILE_FILTER_CLEARED } from 'src/StateProvider/fastContext';
import type { IMoileFilterModel } from 'src/StateProvider/fastContext';

type TInputField = { id: string; fieldValue: string; fieldName: string };

export default function MobileFilterDialog({ isOpen, handleClose, contentPart, columns, dispatch, filters, title, resource = '' }) {
  const [storeUserFilter, setStoreUserFilter] = useStore((store) => store[MOBILE_USER_FILTER]);
  const [storeFormData, setStoreFormData] = useStore((store) => store[MOBILE_FILTER_FORM_DATA]);
  const [storeFilterCleared, setStoreFilterCleared] = useStore((store) => store[MOBILE_FILTER_CLEARED]);
  const [storeMobileFilterModel, setStoreMobileFilterModel] = useStore((store) => store[MOBILE_FILTER_MODEL]);
  const prevResource = React.useRef('');

  const toastConfig = React.useContext(CustomToastContext);
  const [inputFields, setInputFields] = React.useState<TInputField[] | null>(null);
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
    var result: IMoileFilterModel['data'] = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== '') {
        result[v.fieldName] = { filter: v.fieldValue };
      }
    });
    saveDataInStore();
    setStoreMobileFilterModel({ [MOBILE_FILTER_MODEL]: { data: result, changedFrom: 'applyFilter' } });
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
    const result = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== '') {
        result[v.fieldName] = v.fieldValue;
      }
    });
    setFormValues(result);
    setIsSaveFilter({ open: true, data: selectedUserFilter });
  };

  const saveDataInStore = React.useCallback(() => {
    const result = {};
    inputFields?.forEach((v) => {
      if (v.fieldValue && v.fieldValue !== '') {
        result[v.fieldName] = v.fieldValue;
      }
    });
    setStoreFormData({ [MOBILE_FILTER_FORM_DATA]: result });
    setStoreUserFilter({ [MOBILE_USER_FILTER]: selectedUserFilter });
  }, [setStoreFormData, setStoreUserFilter, inputFields, selectedUserFilter]);

  const resetStore = React.useCallback(() => {
    setStoreFormData({ [MOBILE_FILTER_FORM_DATA]: null });
    setStoreUserFilter({ [MOBILE_USER_FILTER]: null });
    setStoreMobileFilterModel({ [MOBILE_FILTER_MODEL]: { data: {}, changedFrom: 'applyFilter' } });
  }, [setStoreFormData, setStoreUserFilter, setStoreMobileFilterModel]);

  // To reset filter for other pages
  const resourceDependency = React.useMemo(() => prevResource.current, []);
  React.useLayoutEffect(() => {
    if (resourceDependency !== resource) {
      resetStore();
    }
  }, [resetStore, resource, resourceDependency]);

  // To change filter from display filter component
  React.useEffect(() => {
    if (storeMobileFilterModel?.changedFrom === 'showFilter' && !storeFilterCleared) {
      if (!storeUserFilter) setSelectedUserFilter(null);
      dispatch({ type: 'filter', filters: storeMobileFilterModel.data });
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: 'Filtered Successfully'
      });
      setStoreFilterCleared({ [MOBILE_FILTER_CLEARED]: true });
    }
  }, [storeMobileFilterModel, storeFilterCleared, setStoreFilterCleared, dispatch, toastConfig, storeUserFilter]);

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
                  <Box className="p-[14px_12px_12px] shadow-[0px_5.44444px_27.22222px_0px_rgba(0,_0,_0,_0.06)] border-1 border border-[var(--common-border-color)] rounded-md">
                    <Box display="flex" alignItems={'center'} className="mb-[10px]">
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
            <Button
              disabled={inputFields?.length === 0 || inputFields?.some((v) => v.fieldValue === '' || v.fieldName === '')}
              type="submit"
              className="no-shadow"
              color="primary"
              size="small"
              variant="contained"
              onClick={handleSubmit}
            >
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

type TData = { id: string; name: string; value: string | number | null; from: 'userFilter' | 'formData' };

export const DisplayFiltersForMobile = ({ resource = '' }) => {
  const [storeUserFilter, setStoreUserFilter] = useStore((store) => store[MOBILE_USER_FILTER]);
  const [storeFormData, setStoreFormData] = useStore((store) => store[MOBILE_FILTER_FORM_DATA]);
  const [_, setStoreMobileFilterModel] = useStore((store) => store[MOBILE_FILTER_MODEL]);
  const [storeFilterCleared, setStoreFilterCleared] = useStore((store) => store[MOBILE_FILTER_CLEARED]);
  const [data, setData] = React.useState<TData[]>([]);
  const prevResource = React.useRef('');

  function humanize(str: string): string {
    return lodash.capitalize(lodash.trim(lodash.snakeCase(str).replace(/_id$/, '').replace(/_/g, ' ')));
  }

  const dataSetter = React.useCallback(() => {
    if (storeUserFilter) {
      const newData: TData = { id: uuidv4(), name: '', value: '', from: 'userFilter' };
      newData.name = storeUserFilter?.title;
      setData([newData]);
    } else {
      const newData: TData[] = [];
      if (storeFormData) {
        for (const [key, value] of Object.entries(storeFormData)) {
          newData.push({ id: uuidv4(), name: key, value: value, from: 'formData' });
        }
      }
      setData(newData);
    }
  }, [storeUserFilter, storeFormData]);

  React.useEffect(() => {
    if (prevResource.current !== resource) {
      prevResource.current = resource;
    } else {
      dataSetter();
    }
  }, [resource, dataSetter]);

  const clearFilter = React.useCallback(
    (data: TData) => {
      const filterModel: IMoileFilterModel = { changedFrom: 'showFilter', data: {} };
      if (data.from === 'userFilter') {
        setStoreUserFilter({ [MOBILE_USER_FILTER]: null });
        setStoreFormData({ [MOBILE_FILTER_FORM_DATA]: null });
        setData([]);
      } else {
        const newStoreData: { [key: string]: string } = {};
        const newData: TData[] = [];
        for (const [key, value] of Object.entries(storeFormData)) {
          if (key !== data.name) {
            newStoreData[key] = value;
            newData.push({ id: uuidv4(), name: key, value: value, from: 'formData' });
            if (value && value !== '') {
              filterModel.data[key] = { filter: value };
            }
          }
        }

        setData(newData);
        setStoreFormData({ [MOBILE_FILTER_FORM_DATA]: newStoreData });
      }
      setStoreMobileFilterModel({ [MOBILE_FILTER_MODEL]: filterModel });
      setStoreFilterCleared({ [MOBILE_FILTER_CLEARED]: false });
    },
    [setStoreUserFilter, setStoreFormData, storeFormData, setStoreFilterCleared, setStoreMobileFilterModel]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <div
          key={item.id}
          className="bg-[var(--new\_theme\_secondary\_color)] text-[var(--primary)] font-medium rounded-lg pl-2 pr-1 text-[14px] flex gap-1 items-center"
        >
          <span>
            {item.from === 'formData' ? humanize(item.name) : item.name}
            {item.value !== '' ? `=${item.value}` : ''}
          </span>
          <span>
            <IconButton aria-label="delete" size="small" style={{ width: 20, height: 20 }} onClick={() => clearFilter(item)}>
              <Close style={{ width: 16, height: 16 }} />
            </IconButton>
          </span>
        </div>
      ))}
    </div>
  );
};

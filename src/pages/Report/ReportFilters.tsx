import React from 'react';
import { Box, Container, TextField, Grid, Button, CircularProgress, Typography, IconButton } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Delete, List } from '@material-ui/icons';
import { KeyboardDatePicker } from '@material-ui/pickers';

import VirtualizedList from '../../components/VirtualizedList';
import { getObjKeys, dateFormat } from '../../constants/helpers';
import FormTypes from '../../components/Helpers/FormTypes';
import ConfirmDialog from '../../components/Helpers/ConfirmationDialog';
import axiosInstance from '../../axios/axiosInstance';

interface FiltersProps {
  resource: string;
  fetchReportData?: VoidFunction;
  loading?: boolean;
  setSelectedData?: any;
  betweenDate: any;
  setBetweenDate: any;
  resourceColumns: any[];
  filterOptions: any;
  setFilterOptions: any;
  selectedResources: any;
  setSelectedResources: any;
  resourceOptions: any;
  setResourceOptions: any;
  formValues: any;
  setFormValues: any;
  loadingColumns?: boolean;
  setSelectedReportView: any;
  selectedReportView: any;
  reportList: any;
  setReportList: any;
}

const ReportFilters = (props: FiltersProps) => {
  const {
    resourceColumns,
    fetchReportData,
    loading,
    setSelectedData,
    setBetweenDate,
    betweenDate,
    filterOptions,
    setFilterOptions,
    selectedResources,
    setSelectedResources,
    resourceOptions,
    setResourceOptions,
    formValues,
    setFormValues,
    loadingColumns,
    setSelectedReportView,
    selectedReportView,
    reportList,
    setReportList
  } = props;
  const [showConfirmDialog, setShowConfirmDialog] = React.useState({ open: false, id: null, name: '' });
  const [isDeleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!resourceColumns && resourceColumns.length === 0) return;

    const optionsData: any = {};
    const filteredData = [...resourceColumns]
      .filter((d: any) => d.isRead && (d.fieldData.type === 'dropDown' || d.fieldData.type === 'date'))
      .map((d: any) => {
        if (d.fieldData.type === 'dropDown') {
          optionsData[d.fieldData.fieldName] = {
            options: d.fieldData.option,
            type: d.fieldData.type,
            lookup: Boolean(d.fieldData?.lookup)
          };
        }
        return d.fieldData;
      });
    setResourceOptions(optionsData);
    setFormValues({ ...getObjKeys('', filteredData), status: '', owner: '' });
    setFilterOptions([{ fieldLabel: 'All', fieldName: 'all', _id: '0' }, ...filteredData]);
  }, [resourceColumns]);

  const handleSelectFilter = (name, value) => {
    let fieldProps: any = {};
    if (!name.includes('Date')) {
      fieldProps.type = resourceOptions[name].type;
      fieldProps.lookup = resourceOptions[name].lookup;
    } else {
      fieldProps.type = 'date';
      fieldProps.lookup = false;
    }

    const newData: any = {
      type: fieldProps.type,
      lookup: fieldProps.lookup
    };

    if (Array.isArray(value)) {
      newData.value = resourceOptions[name].options?.filter((d) => value?.includes(d.optionValue));
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    } else {
      newData.value = value;
      setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
    }
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleRemoveOption = () => {
    setDeleting(true);
    setReportList((prevList) => prevList.filter((list) => list._id === showConfirmDialog.id));
    axiosInstance()
      .put(`report-colum-setting/remove`, {
        ids: [showConfirmDialog.id]
      })
      .then(() => {
        setDeleting(false);
        setShowConfirmDialog({ open: false, id: null, name: '' });
      })
      .catch((err) => {
        setDeleting(false);
        setShowConfirmDialog({ open: false, id: null, name: '' });
      });
  };

  return (
    <Container maxWidth="sm">
      <Box height={'100%'} my={2}>
        <Autocomplete
          loading={loadingColumns}
          loadingText="Please wait..."
          options={filterOptions}
          limitTags={4}
          disableListWrap
          ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
          disableCloseOnSelect={false}
          multiple
          value={selectedResources ?? []}
          onChange={(_, val) => {
            if (val.filter((f) => f.fieldName === 'all').length > 0) {
              setSelectedResources(filterOptions);
            } else {
              setSelectedResources(val);
            }
            // if (selectedData) {
            //   setSelectedData((prevState) => {
            //     const data = Object.keys(prevState);
            //     const unselected = data.filter((d) => !val.includes(d));
            //     const unselectedData = { ...prevState };
            //     unselected.forEach((_d) => {
            //       if (unselectedData[_d]) {
            //         delete unselectedData[_d];
            //       }
            //     });
            //     return unselectedData;
            //   });
            // }
          }}
          fullWidth
          getOptionSelected={(option, val) => option.fieldName === val.fieldName}
          getOptionLabel={(option) => option.fieldLabel}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Select Filter" size="small" />}
        />
        <Box py={2} >
          <Grid container spacing={2}>
            {selectedResources.length > 0 ? (
              selectedResources.map((field: any) => (
                <>
                  {field.fieldName !== 'all' && field.type !== 'date' && (
                    <Grid key={field._id} item xs={12} sm={6} md={6}>
                      <FormTypes
                        values={formValues}
                        errors={{}}
                        touched={{}}
                        label={field.fieldLabel}
                        name={field.fieldName}
                        type={field.type === 'dropDown' ? 'multiSelect' : field.type}
                        options={field.option}
                        setFieldValue={handleSelectFilter}
                        required={false}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                  )}

                  {field.type === 'date' && (
                    <Grid key={field._id} item xs={12} sm={6}>
                      <KeyboardDatePicker
                        autoOk
                        fullWidth
                        size="medium"
                        variant="inline"
                        inputVariant="outlined"
                        name={field.fieldName}
                        label={field.fieldLabel}
                        value={betweenDate && betweenDate[field.fieldName] ? betweenDate[field.fieldName] : new Date()}
                        onChange={(date: any) => {
                          setBetweenDate((prevState) => ({ ...prevState, [field.fieldName]: date }));
                        }}
                        format={dateFormat}
                        InputLabelProps={{
                          shrink: true
                        }}
                        margin="dense"
                      />
                    </Grid>
                  )}
                </>
              ))
            ) : (
              <Box textAlign="center" width="100%">
                <Typography>No filters selected</Typography>
              </Box>
            )}
          </Grid>
        </Box>
        <Box mt={2}>
          <Box height={'100%'} mb={2}>
            <Autocomplete
              options={reportList}
              value={selectedReportView}
              noOptionsText="No views were found"
              onChange={(_, val) => {
                setSelectedReportView(val);
              }}
              fullWidth
              renderOption={(option) => (
                <React.Fragment>
                  <Box display={'flex'} width="100%" justifyContent="space-between">
                    {option.name}
                    {isDeleting ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDialog({ open: true, id: option._id, name: option.name });
                        }}
                      >
                        <Delete color="error" />
                      </IconButton>
                    )}
                  </Box>
                </React.Fragment>
              )}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => <TextField {...params} variant="outlined" label="Select View" size="small" />}
            />
          </Box>
          <Button
            onClick={fetchReportData}
            startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <List />}
            color="primary"
            variant="contained"
            size="small"
            disableElevation
            fullWidth
            disabled={loading}
          >
            Show
          </Button>
        </Box>
      </Box>
      {showConfirmDialog.open && (
        <ConfirmDialog
          onClose={() => setShowConfirmDialog({ open: false, id: null, name: '' })}
          onOk={() => handleRemoveOption()}
          open={true}
          okBtnLoading={isDeleting}
          message={
            <>
              Are you sure you want to delete view <Box component={'span'} px={1} bgcolor="#eee">{showConfirmDialog.name}</Box>?
            </>
          }
        />
      )}
    </Container>
  );
};

export default ReportFilters;

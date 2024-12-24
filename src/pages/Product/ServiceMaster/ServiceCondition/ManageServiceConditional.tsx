import { Fragment, useContext, useEffect, useState } from 'react';
import { Box, Button, Dialog, IconButton, MenuItem, TextField } from '@mui/material';
import { isMobile, isTablet } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition, dateFormat, prepareDataForGrid, sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { FieldArray, Form, Formik } from 'formik';
import { camelCase, isEqual } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { Autocomplete } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomReactTable, { getStaticFields, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { useData } from 'src/StateProvider/Provider';
import { DetailsPageHeader } from 'src/components/PageHeaders';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const OPERATOR = [
  {
    optionLabel: 'Less than',
    optionValue: 'lessThan'
  },
  {
    optionLabel: 'Less than or equals',
    optionValue: 'lessThanOrEquals'
  },
  {
    optionLabel: 'Equal to',
    optionValue: 'equalTo'
  },
  {
    optionLabel: 'Greater than',
    optionValue: 'greaterThan'
  },
  {
    optionLabel: 'Greater than or equals',
    optionValue: 'greaterThanOrEquals'
  },
  {
    optionLabel: 'Equal to Current Date',
    optionValue: 'equalToCurrentDate'
  }
];

const ManageServiceConditional = ({ onClose, onSuccess, productId, id }) => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource?.serviceMaster);
  const [initialData, setInitialData] = useState(null);
  const [fullScreen, setFullScreen] = useState(true);
  const [assetFieldOptions, setAssetFieldOptions] = useState([]);
  const [columns, setColumns] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const { generateColumns } = useColumns();
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const { selectedRecords, showFilteredRecordsOnly, dataRows } = state;

  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
    fetchAssetFieldOptions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);
  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.serviceMaster}`);
    data = response?.data?.data;
    const newColumns = generateColumns(renderedFrom, data, routes.serviceMaster.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={false}
            onClick={() => {
              setDeleteRecord(row.original);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon color={'error'} />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (id) {
      axiosInstance()
        .get(`${routes.product.path}/${productId}/service-conditional/${id}`)
        .then(({ data: { data } }) => {
          let rows = data?.services?.map((u) => {
            let finalObject: any = prepareDataForGrid(u, user);
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows || [], count: rows?.length || 0 });
          setInitialData({
            description: data?.description,
            condition: data?.condition,
            services: data?.services?.map((service) => service?._id)
          });
          dispatch({ type: 'loading', loading: false });
        })
        .catch((error) => {
          dispatch({ type: 'loading', loading: false });
          toastConfig.setToastConfig(error);
        });
    } else {
      setInitialData({
        description: '',
        condition: [{ field: null, operator: null, value: null }],
        services: []
      });
      dispatch({ type: 'initialize', data: [], count: 0 });
      dispatch({ type: 'loading', loading: false });
    }
  };

  const fetchAssetFieldOptions = async () => {
    const fields = await axiosInstance().get(`/field?resource=${sidebarResource.serializedAsset}`);
    const fieldsData = fields.data?.data;
    const assetFields = fieldsData
      .filter((field) => ['number', 'decimal'].includes(field.fieldData.type) || field.fieldData.fieldName === 'recertDate')
      ?.map((ele) => {
        return {
          optionValue: ele.fieldData.fieldName,
          optionLabel: ele.fieldData.fieldLabel
        };
      });

    setAssetFieldOptions(assetFields);
  };

  const handleSave = (values) => {
    setLoading(true);
    const services = dataRows?.map((e) => e?._id) ?? [];
    const data = { ...values, services };
    if (id) {
      axiosInstance()
        .put(`${routes.product.path}/${productId}/service-conditional`, { ...data, _id: id })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess();
        })
        .catch((err) => {
          setLoading(false);
          toastConfig.setToastConfig(err);
        });
    } else {
      axiosInstance()
        .post(`${routes.product.path}/${productId}/service-conditional`, { ...data })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setLoading(false);
          onSuccess();
        })
        .catch((err) => {
          setLoading(false);
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    const updatedRows = dataRows?.filter((ele) => ![...ids].includes(ele._id)) ?? [];
    dispatch({ type: 'update', data: updatedRows });
    dispatch({ type: 'selection', selectedRecords: [] });
    setShowDeleteConfirmBox(false);
    setDeleteRecord(null);
  };

  function validate(values) {
    const errors = {};
    if (values.description === '') {
      errors['description'] = 'Please enter description';
    }
    if (values?.condition?.length > 0) {
      values?.condition?.forEach((cnd: any, i) => {
        if (!cnd?.field) {
          errors[`condition.${i}.field`] = 'Field is Required';
        }
        if (!cnd?.operator) {
          errors[`condition.${i}.operator`] = 'Operator is Required';
        }
        if (!cnd?.value) {
          errors[`condition.${i}.value`] = 'Value is Required';
        }
      });
    }
    return errors;
  }

  const addButtonMenuItems = () => {
    return (
      <>
        <MenuItem onClick={() => setOpenAddDialog(true)}>Add Services</MenuItem>
      </>
    );
  };

  const actionButtonMenuItems = () => {
    return (
      <>
        <MenuItem disabled={selectedRecords.length === 0} onClick={() => setShowDeleteConfirmBox(true)}>
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <Fragment>
      <Dialog
        fullWidth
        maxWidth="md"
        TransitionComponent={CustomDialogTransition}
        fullScreen={fullScreen || isMobile || isTablet}
        open={true}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
          }
        }}
        aria-labelledby="assign-roles-dialog"
      >
        {initialData && assetFieldOptions && columns ? (
          <>
            <CustomDialogHeader
              title={id ? `Edit Condition` : 'Add Condition'}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              showRequiredLabel={true}
              onClose={onClose}
            />
            <Formik initialValues={initialData} onSubmit={handleSave} validateOnMount validate={validate}>
              {({ values, errors, touched, submitForm, setFieldValue }) => (
                <>
                  <CustomDialogContent>
                    <Form autoComplete="off" autoCorrect="off" noValidate>
                      <div className="mt-2 flex flex-col gap-4">
                        <TextField
                          variant="outlined"
                          type="text"
                          label="Description"
                          required={true}
                          name="description"
                          size="small"
                          fullWidth
                          value={values['description']}
                          error={touched['description'] && Boolean(errors['description'])}
                          helperText={touched['description'] && errors['description']}
                          onChange={(e) => {
                            setFieldValue('description', e.target.value.trimStart());
                          }}
                        />
                        <div className="conditions-container container-with-border mb-2 p-2 sm:mb-3 sm:p-3 md:mb-4 md:p-4">
                          <div className="grid gap-4">
                            <FieldArray name="condition">
                              {({ push, remove }) => (
                                <div className=" flex flex-col gap-2">
                                  <div className="flex w-full items-center justify-between">
                                    <h2 style={{ margin: 0 }} className="form-label-style mb-3">
                                      Conditions
                                    </h2>
                                    <HtmlTooltip title="Add">
                                      <IconButton size="small" aria-label="add" onClick={() => push({ field: null, operator: null, value: null })}>
                                        <AddIcon fontSize="small" color={'primary'} />
                                      </IconButton>
                                    </HtmlTooltip>
                                  </div>

                                  {values?.condition?.map((cnd, i) => {
                                    return (
                                      <Box className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr] md:grid-cols-[1fr_1fr_1fr_auto]">
                                        <Box>
                                          <Autocomplete
                                            options={assetFieldOptions}
                                            getOptionLabel={(option) => option?.optionLabel || ''}
                                            value={assetFieldOptions?.find((data) => data?.optionValue === values?.condition[i]?.field) ?? ''}
                                            fullWidth
                                            onChange={(e, newValue) => {
                                              setFieldValue(`condition.${i}.field`, newValue?.optionValue);
                                            }}
                                            size="small"
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                label="Field"
                                                margin="none"
                                                size="small"
                                                error={touched?.condition && Boolean(errors[`condition.${i}.field`])}
                                                helperText={touched?.condition && errors[`condition.${i}.field`]}
                                                variant="outlined"
                                              />
                                            )}
                                          />
                                        </Box>
                                        <Box>
                                          <Autocomplete
                                            options={OPERATOR}
                                            getOptionLabel={(option: any) => option?.optionLabel ?? ''}
                                            value={OPERATOR?.find((data) => data?.optionValue === values?.condition[i]?.operator) ?? ''}
                                            fullWidth
                                            onChange={(event, newValue: any) => {
                                              setFieldValue(`condition.${i}.operator`, newValue?.optionValue);
                                            }}
                                            size="small"
                                            renderInput={(params) => (
                                              <TextField
                                                {...params}
                                                label="Operator"
                                                margin="none"
                                                size="small"
                                                error={touched?.condition && Boolean(errors[`condition.${i}.operator`])}
                                                helperText={touched?.condition && errors[`condition.${i}.operator`]}
                                                variant="outlined"
                                              />
                                            )}
                                          />
                                        </Box>
                                        <Box>
                                          {cnd.field === 'recertDate' ? (
                                            <DatePicker
                                              autoOk
                                              fullWidth
                                              size="small"
                                              variant="inline"
                                              inputVariant="outlined"
                                              value={values?.condition[i]?.value ? new Date(values?.condition[i]?.value) : null}
                                              name="value"
                                              label="Value"
                                              onChange={(date: any) => {
                                                setFieldValue(`condition.${i}.value`, date);
                                              }}
                                              error={touched?.condition && Boolean(errors[`condition.${i}.value`])}
                                              helperText={touched?.condition && errors[`condition.${i}.value`]}
                                              format={dateFormat}
                                              InputLabelProps={{
                                                shrink: true
                                              }}
                                              margin="dense"
                                            />
                                          ) : (
                                            <TextField
                                              margin="none"
                                              size="small"
                                              type="number"
                                              label="Value"
                                              name="value"
                                              variant="outlined"
                                              fullWidth
                                              value={values?.condition[i]?.value}
                                              error={touched?.condition && Boolean(errors[`condition.${i}.value`])}
                                              helperText={touched?.condition && errors[`condition.${i}.value`]}
                                              onChange={(e) => {
                                                setFieldValue(`condition.${i}.value`, parseFloat(e.target.value));
                                              }}
                                            />
                                          )}
                                        </Box>
                                        <Box className=" ml-auto max-w-fit" display="flex" justifyContent="space-between" alignItems="center">
                                          <HtmlTooltip title="Remove">
                                            <IconButton size="small" aria-label="close" onClick={() => remove(i)}>
                                              <CloseIcon fontSize="small" color={'primary'} />
                                            </IconButton>
                                          </HtmlTooltip>
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </div>
                              )}
                            </FieldArray>
                          </div>
                        </div>
                      </div>
                    </Form>
                    <div className="container-with-border mb-2 p-2 sm:mb-3 sm:p-3 md:mb-4 md:p-4">
                      <DetailsPageHeader
                        isAddButtonVisible={true}
                        addButtonMenuItems={addButtonMenuItems()}
                        isActionButtonVisible={true}
                        actionButtonMenuItems={actionButtonMenuItems()}
                        actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
                        hasXpadding={false}
                      />
                      {columns ? (
                        <CustomReactTable
                          height={'calc(100vh - 345px)'}
                          columns={columns}
                          state={state}
                          dispatch={dispatch}
                          refreshGrid={fetchData}
                          renderedFrom={renderedFrom}
                          isClientSideGrid={true}
                        />
                      ) : (
                        <Box p={2} height={500}>
                          <CommonSkeleton lenArray={[...Array(10).keys()]} />
                        </Box>
                      )}
                    </div>
                  </CustomDialogContent>
                  <CustomDialogFooter>
                    <Button type="button" variant="outlined" color="primary" size="small" onClick={onClose}>
                      Cancel
                    </Button>
                    <CustomButton
                      disabled={
                        values?.condition?.length === 0 ||
                        dataRows?.length === 0 ||
                        isEqual(initialData, { ...values, services: dataRows?.map((e) => e._id) })
                      }
                      loading={loading}
                      variant="contained"
                      color="primary"
                      onClick={submitForm}
                    >
                      Save
                    </CustomButton>
                  </CustomDialogFooter>
                </>
              )}
            </Formik>
          </>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Dialog>
      {openAddDialog && (
        <AssignServiceDialog
          onSuccess={(services) => {
            const allServices = [...services, ...dataRows];
            dispatch({ type: 'selection', selectedRecords: [] });
            dispatch({ type: 'initialize', data: allServices || [], count: allServices?.length || 0 });
            setOpenAddDialog(false);
          }}
          handleClose={() => {
            setOpenAddDialog(false);
          }}
          hideQty={true}
          ids={dataRows?.map((e) => e?._id) || []}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Fragment>
  );
};

export default ManageServiceConditional;

import { useState, useContext, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { object, string, boolean } from 'yup';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete, Box, Card, CardContent, IconButton, Divider } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import { UnCamelCase } from '../../constants/helpers';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import JoinInnerIcon from '@mui/icons-material/JoinInner';
import FunctionsIcon from '@mui/icons-material/Functions';
import { PipelineItem, LookupPipeline, GroupPipeline, SortPipeline, LimitPipeline, OPERATIONS, getUniqueResources, validatePipeline } from './utils';

const schema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('Report name  is required'),
  resource: string().required('Resource is required'),
  pageNumberInFooter: boolean()
});

export default function ReportBuilderDetail() {
  const { id } = useParams();
  const history = useHistory();
  const [initialValues, setInitialValues] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, resources }
  }: any = useData();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBreakCrumbPath, setIsBreakCrumbPath] = useState('');
  const [formValues, setFormValues] = useState(null);
  const [resourceFieldMap, setResourceFieldMap] = useState({});
  const [resourceOptions, setresourceOptions] = useState(null);
  const [isEdit, setIsEdit] = useState(id === '0' ? true : false);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [hasSortItem, setHasSortItem] = useState(false);
  const [hasLimitItem, setHasLimitItem] = useState(false);
  const [pipelineErrors, setPipelineErrors] = useState<{ [itemId: string]: string[] }>({});

  const onBackButtonEvent = useCallback((e) => {
    e.preventDefault();
    window.history.pushState(null, null, window.location.pathname);
    setShowConfirmDialog(true);
  }, []);

  const fetchResourceFields = useCallback(
    async (resource) => {
      try {
        if (resourceFieldMap?.hasOwnProperty(resource)) return;
        const {
          data: { data }
        } = await axiosInstance().get(`/field?resource=${resource}`);

        setResourceFieldMap((prev) => ({
          ...prev,
          [resource]: data?.filter((e) => e.isRead)?.map((e) => e.fieldData)
        }));
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    },
    [resourceFieldMap, toastConfig]
  );

  const fetchData = async () => {
    const initialValues = {
      name: '',
      resource: '',
      pipeline: []
    };
    if (id && id !== '0') {
      try {
        const res = await axiosInstance().get(`/report-builder/${id}`);
        const {
          data: { data }
        } = res;
        initialValues.resource = data?.resource;
        initialValues.pipeline = data?.pipeline || [];
        initialValues.name = data?.name;

        setPipeline(data?.pipeline || []);

        setHasSortItem((data?.pipeline || []).some((item) => item.type === 'sort'));
        setHasLimitItem((data?.pipeline || []).some((item) => item.type === 'limit'));

        const uniqueResources = getUniqueResources(data?.pipeline || [], data?.resource);
        uniqueResources?.forEach((resource) => fetchResourceFields(resource));
      } catch (e) {
        toastConfig.setToastConfig(e);
      }
    }
    setInitialValues({ ...initialValues });
  };

  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener('popstate', onBackButtonEvent);
    return () => {
      window.removeEventListener('popstate', onBackButtonEvent);
    };
  }, [onBackButtonEvent]);

  useEffect(() => {
    const options = [];
    for (const [key] of Object.entries(permissions)) {
      const title = resources?.[key] ? resources?.[key]?.titleSingular : UnCamelCase(key);
      options.push({ title: title, value: title });
    }
    setresourceOptions(options);
  }, [permissions, resources]);

  useEffect(() => {
    if (formValues && formValues?.resource) {
      fetchResourceFields(formValues?.resource);
    }
  }, [formValues, fetchResourceFields]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const generateId = (type: string) => `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addPipelineItem = (type: 'lookup' | 'group' | 'sort' | 'limit') => {
    const _id = generateId(type);
    let newItem: PipelineItem;

    switch (type) {
      case 'lookup':
        newItem = {
          _id,
          type: 'lookup',
          withResource: '',
          fieldToMatch: [{ localField: '', lookupResourceField: '' }]
        } as LookupPipeline;
        break;
      case 'group':
        newItem = {
          _id,
          type: 'group',
          fields: [],
          accumulator: [{ field: '', operation: '', outputField: '' }]
        } as GroupPipeline;
        break;
      case 'sort':
        newItem = {
          _id,
          type: 'sort',
          sortBy: {}
        } as SortPipeline;
        setHasSortItem(true);
        break;
      case 'limit':
        newItem = {
          _id,
          type: 'limit',
          limit: 10
        } as LimitPipeline;
        setHasLimitItem(true);
        break;
      default:
        return;
    }

    setPipeline((prev) => [...prev, newItem]);
  };

  const updatePipelineItem = (id: string, updates: Partial<PipelineItem>) => {
    setPipeline((prev) => prev.map((item) => (item._id === id ? { ...item, ...updates } : item)));
  };

  const removePipelineItem = (id: string) => {
    setPipeline((prev) => {
      const filtered = prev.filter((item) => item._id !== id);
      const removedItem = prev.find((item) => item._id === id);

      if (removedItem?.type === 'sort') {
        setHasSortItem(false);
      }
      if (removedItem?.type === 'limit') {
        setHasLimitItem(false);
      }

      return filtered;
    });
  };

  const handleSubmit = (values) => {
    const errors = validatePipeline(pipeline);
    if (Object.keys(errors).length > 0) {
      setPipelineErrors(errors);
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Please fix the errors in pipeline configuration'
      });
      return;
    }

    setIsUpdating(true);

    if (id === '0') {
      axiosInstance()
        .post('/report-builder', {
          name: values.name.trim(),
          pipeline: pipeline,
          resource: values?.resource
        })
        .then(({ data: { data, message } }) => {
          if (isBreakCrumbPath) {
            history.push({ pathname: isBreakCrumbPath });
          } else {
            history.push(`${routes.reportBuilderDetail.path}/${data._id}`);
          }
          setIsUpdating(false);
          setIsEdit(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    } else {
      let api = '/report-builder';
      axiosInstance()
        .put(api, {
          _id: id,
          name: values.name.trim(),
          pipeline: pipeline,
          resource: values?.resource
        })
        .then(({ data: { data, message } }) => {
          if (isBreakCrumbPath) {
            history.push({ pathname: isBreakCrumbPath });
          } else {
            fetchData();
          }
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: message
          });
          setIsUpdating(false);
          setIsEdit(false);
        })
        .catch((error) => {
          setIsUpdating(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleClose = () => {
    history.push({ pathname: isBreakCrumbPath ? isBreakCrumbPath : routes.reportBuilder.path });
  };

  const FieldMatchRow = ({
    item,
    matchIndex,
    localFields,
    lookupFields,
    onUpdate,
    onRemove,
    showRemove = false
  }: {
    item: LookupPipeline;
    matchIndex: number;
    localFields: any[];
    lookupFields: any[];
    onUpdate: (updates: any) => void;
    onRemove?: () => void;
    showRemove?: boolean;
  }) => (
    <Grid container spacing={2} alignItems="center" sx={{ mt: matchIndex > 0 ? 1 : 0 }}>
      {matchIndex > 0 && (
        <>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Box />
          </Grid>
        </>
      )}
      {matchIndex === 0 && (
        <>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Autocomplete
              disabled={true}
              value={{ title: formValues?.resource, value: formValues?.resource }}
              options={[{ title: formValues?.resource, value: formValues?.resource }]}
              getOptionLabel={(option) => option.title}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="From Resource"
                  variant="outlined"
                  fullWidth
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Autocomplete
              disabled={!isEdit}
              value={resourceOptions?.filter((option) => option.value !== formValues?.resource)?.find((r) => r.value === item.withResource) || null}
              options={resourceOptions?.filter((option) => option.value !== formValues?.resource) || []}
              getOptionLabel={(option) => option.title}
              onChange={(e, val) => {
                onUpdate({
                  withResource: val?.value || '',
                  fieldToMatch: [{ localField: '', lookupResourceField: '' }]
                });
                if (val?.value) {
                  fetchResourceFields(val.value);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="With Resource"
                  variant="outlined"
                  fullWidth
                  required
                  error={pipelineErrors[item._id]?.includes('withResource_required')}
                  helperText={pipelineErrors[item._id]?.includes('withResource_required') ? 'With Resource is required' : ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 12, sm: matchIndex > 0 ? 3 : 3 }}>
        <Autocomplete
          disabled={!isEdit || !item.withResource}
          value={localFields.find((f) => f.fieldName === item?.fieldToMatch?.[matchIndex]?.localField) || null}
          options={localFields}
          getOptionLabel={(option) => option.fieldLabel}
          onChange={(e, val) => {
            const updatedFieldToMatch = [...item.fieldToMatch];
            updatedFieldToMatch[matchIndex] = { ...updatedFieldToMatch[matchIndex], localField: val?.fieldName || '' };
            onUpdate({ fieldToMatch: updatedFieldToMatch });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Local Field"
              variant="outlined"
              fullWidth
              required
              error={pipelineErrors[item._id]?.includes(`localField_${matchIndex}_required`)}
              helperText={pipelineErrors[item._id]?.includes(`localField_${matchIndex}_required`) ? 'Local Field is required' : ''}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: matchIndex > 0 ? 2 : 3 }}>
        <Autocomplete
          disabled={!isEdit || !item.withResource}
          value={lookupFields.find((f) => f.fieldName === item?.fieldToMatch?.[matchIndex]?.lookupResourceField) || null}
          options={lookupFields}
          getOptionLabel={(option) => option.fieldLabel}
          onChange={(e, val) => {
            const updatedFieldToMatch = [...item?.fieldToMatch];
            updatedFieldToMatch[matchIndex] = { ...updatedFieldToMatch[matchIndex], lookupResourceField: val?.fieldName || '' };
            onUpdate({ fieldToMatch: updatedFieldToMatch });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="With Resource Field"
              variant="outlined"
              fullWidth
              required
              error={pipelineErrors[item._id]?.includes(`lookupResourceField_${matchIndex}_required`)}
              helperText={pipelineErrors[item._id]?.includes(`lookupResourceField_${matchIndex}_required`) ? 'With Resource Field is required' : ''}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
      </Grid>
      {showRemove && (
        <Grid size={{ xs: 12, sm: 1 }}>
          <IconButton size="small" onClick={onRemove} disabled={!isEdit}>
            <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Grid>
      )}
    </Grid>
  );

  const AccumulatorRow = ({
    accumulator,
    accIndex,
    resourceFields,
    onUpdate,
    onRemove,
    showRemove = false
  }: {
    accumulator: any;
    accIndex: number;
    resourceFields: any[];
    onUpdate: (updates: any) => void;
    onRemove?: () => void;
    showRemove?: boolean;
  }) => (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Grid size={{ xs: 12, sm: 3 }}>
        <Autocomplete
          disabled={!isEdit}
          value={OPERATIONS.find((op) => op.value === accumulator.operation) || null}
          options={OPERATIONS}
          getOptionLabel={(option) => option.label}
          onChange={(e, val) => {
            onUpdate({ operation: val?.value || 'count' });
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Operation"
              variant="outlined"
              fullWidth
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />
      </Grid>
      {accumulator?.operation !== 'count' && (
        <Grid size={{ xs: 12, sm: 3 }}>
          <Autocomplete
            disabled={!isEdit}
            value={resourceFields.find((f) => f.fieldName === accumulator.field) || null}
            options={resourceFields}
            getOptionLabel={(option) => option.fieldLabel}
            onChange={(e, val) => {
              onUpdate({ field: val?.fieldName || '' });
            }}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Field" variant="outlined" fullWidth required slotProps={{ inputLabel: { shrink: true } }} />
            )}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, sm: 3 }}>
        <TextField
          disabled={!isEdit}
          size="small"
          label="Output Field Name"
          variant="outlined"
          fullWidth
          value={accumulator?.outputField}
          slotProps={{ inputLabel: { shrink: true } }}
          onChange={(e) => {
            onUpdate({ outputField: e.target.value });
          }}
        />
      </Grid>
      {showRemove && (
        <Grid size={{ xs: 12, sm: 1 }}>
          <IconButton size="small" onClick={onRemove} disabled={!isEdit}>
            <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Grid>
      )}
    </Grid>
  );

  const renderLookupComponent = (item: LookupPipeline) => {
    const localFields = [{ fieldName: '_id', fieldLabel: '_id' }, ...(resourceFieldMap[formValues?.resource] || [])];
    const lookupFields = [{ fieldName: '_id', fieldLabel: '_id' }, ...(resourceFieldMap[item?.withResource] || [])];

    return (
      <Card key={item._id} sx={{ mb: 2, border: pipelineErrors[item._id]?.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <JoinInnerIcon color="primary" />
              <span style={{ fontWeight: 500 }}>Join data</span>
            </Box>
            <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
              <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
            </IconButton>
          </Box>

          <FieldMatchRow
            item={item}
            matchIndex={0}
            localFields={localFields}
            lookupFields={lookupFields}
            onUpdate={(updates) => updatePipelineItem(item._id, updates)}
          />

          {item?.fieldToMatch?.length > 1 &&
            item?.fieldToMatch?.slice(1).map((_, index) => (
              <FieldMatchRow
                key={index + 1}
                item={item}
                matchIndex={index + 1}
                localFields={localFields}
                lookupFields={lookupFields}
                onUpdate={(updates) => updatePipelineItem(item._id, updates)}
                onRemove={() => {
                  const updatedFieldToMatch = item?.fieldToMatch?.filter((_, i) => i !== index + 1);
                  updatePipelineItem(item._id, { fieldToMatch: updatedFieldToMatch });
                }}
                showRemove={true}
              />
            ))}

          <Box mt={2}>
            <ThemeButton
              startIcon={<AddIcon />}
              onClick={() => {
                const updatedFieldToMatch = [...item.fieldToMatch, { localField: '', lookupResourceField: '' }];
                updatePipelineItem(item._id, { fieldToMatch: updatedFieldToMatch });
              }}
              disabled={!isEdit}
            >
              Add Field Match
            </ThemeButton>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderGroupComponent = (item: GroupPipeline) => {
    const resourceFields = resourceFieldMap?.[formValues?.resource] || [];
    const fieldOptions = resourceFields?.map((field) => ({ optionValue: field.fieldName, optionLabel: field.fieldLabel }));
    const itemErrors = pipelineErrors[item._id] || [];

    return (
      <Card key={item._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <FunctionsIcon color="primary" />
              <span style={{ fontWeight: 500 }}>Summarize</span>
            </Box>
            <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
              <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
            </IconButton>
          </Box>

          {item?.accumulator?.map((acc, index) => (
            <AccumulatorRow
              key={index}
              accumulator={acc}
              accIndex={index}
              resourceFields={resourceFields}
              onUpdate={(updates) => {
                const updatedAccumulator = [...item.accumulator];
                updatedAccumulator[index] = { ...updatedAccumulator[index], ...updates };
                updatePipelineItem(item._id, { accumulator: updatedAccumulator });
              }}
              onRemove={
                item?.accumulator?.length > 1
                  ? () => {
                      const updatedAccumulator = item?.accumulator?.filter((_, i) => i !== index);
                      updatePipelineItem(item._id, { accumulator: updatedAccumulator });
                    }
                  : undefined
              }
              showRemove={item?.accumulator?.length > 1}
            />
          ))}

          <Box mb={2}>
            <ThemeButton
              startIcon={<AddIcon />}
              onClick={() => {
                const updatedAccumulator = [...item.accumulator, { field: '', operation: '', outputField: '' }];
                updatePipelineItem(item._id, { accumulator: updatedAccumulator });
              }}
              disabled={!isEdit}
            >
              Add Operation
            </ThemeButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <span style={{ fontWeight: 500, marginRight: 8, marginBottom: 2 }}>Group by:</span>
            <Autocomplete
              disabled={!isEdit}
              multiple
              limitTags={4}
              disableCloseOnSelect
              value={fieldOptions.filter((option) => item.fields.includes(option.optionValue))}
              options={fieldOptions}
              getOptionLabel={(option) => option.optionLabel}
              isOptionEqualToValue={(option, val) => option.optionValue === val.optionValue}
              onChange={(e, val) => {
                updatePipelineItem(item._id, { fields: val.map((v) => v.optionValue) });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Select Fields"
                  variant="outlined"
                  fullWidth
                  required
                  error={pipelineErrors[item._id]?.includes('fields_required')}
                  helperText={pipelineErrors[item._id]?.includes('fields_required') ? 'Group by fields are required' : ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderSortComponent = (item: SortPipeline) => {
    const resourceFields = resourceFieldMap?.[formValues?.resource] || [];
    const sortField = Object.keys(item.sortBy)[0] || '';
    const sortOrder = item.sortBy[sortField] || 1;
    const itemErrors = pipelineErrors[item._id] || [];

    return (
      <Card key={item?._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <SortIcon color="primary" />
              <span style={{ fontWeight: 500 }}>Sort</span>
            </Box>
            <IconButton size="small" onClick={() => removePipelineItem(item?._id)} disabled={!isEdit}>
              <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
            </IconButton>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                disabled={!isEdit}
                value={resourceFields.find((f) => f.fieldName === sortField) || null}
                options={resourceFields}
                getOptionLabel={(option) => option.fieldLabel}
                onChange={(e, val) => {
                  updatePipelineItem(item?._id, {
                    sortBy: val ? { [val.fieldName]: sortOrder } : {}
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Sort Field"
                    variant="outlined"
                    fullWidth
                    required
                    error={pipelineErrors[item._id]?.includes('sortBy_required')}
                    helperText={pipelineErrors[item._id]?.includes('sortBy_required') ? 'Sort Field is required' : ''}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                disabled={!isEdit}
                value={{ value: sortOrder, label: sortOrder === 1 ? 'Ascending' : 'Descending' }}
                options={[
                  { value: 1, label: 'Ascending' },
                  { value: -1, label: 'Descending' }
                ]}
                getOptionLabel={(option) => option.label}
                onChange={(e, val) => {
                  if (sortField && val) {
                    updatePipelineItem(item?._id, {
                      sortBy: { [sortField]: val.value }
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    label="Sort Order"
                    variant="outlined"
                    fullWidth
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderLimitComponent = (item: LimitPipeline) => {
    const itemErrors = pipelineErrors[item._id] || [];

    return (
      <Card key={item?._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <FormatListNumberedIcon color="primary" />
              <span style={{ fontWeight: 500 }}>Row limit</span>
            </Box>
            <IconButton size="small" onClick={() => removePipelineItem(item?._id)} disabled={!isEdit}>
              <DeleteIcon fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                disabled={!isEdit}
                size="small"
                type="number"
                label="Limit"
                variant="outlined"
                fullWidth
                required
                value={item.limit}
                error={pipelineErrors[item._id]?.includes('limit_required')}
                helperText={pipelineErrors[item._id]?.includes('limit_required') ? 'Limit is required' : ''}
                slotProps={{
                  input: {
                    inputProps: { min: 1 }
                  },
                  inputLabel: { shrink: true }
                }}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  updatePipelineItem(item?._id, { limit: value });
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return initialValues ? (
    <>
      <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit} enableReinitialize={true}>
        {({ submitForm, touched, errors, setFieldValue, values }) => {
          if (!isEqual(values, formValues)) {
            setFormValues(values);
          }

          return (
            <Form>
              <div className="main-container-v1">
                <div className="headerbox-v1">
                  <div className="nav-v1">
                    <CustomBreadCrumbs
                      routes={[
                        {
                          title: resources?.reportBuilder?.titlePlural,
                          path: routes.reportBuilder.path
                        },
                        {
                          title: id === '0' ? 'New' : initialValues && initialValues.name
                        }
                      ]}
                      isConfirmBeforeClick={true}
                      onBreadCrumbClick={(path) => {
                        setIsBreakCrumbPath(path);

                        if (!isEqual({ ...values }, initialValues)) {
                          setShowConfirmDialog(true);
                        } else {
                          handleClose();
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isEdit && (
                      <ThemeButton disabled={isUpdating} onClick={submitForm} buttonType="theme" isLoading={isUpdating}>
                        Save
                      </ThemeButton>
                    )}
                    {!isEdit && (
                      <ThemeButton buttonType="theme" onClick={() => setIsEdit(true)}>
                        Edit
                      </ThemeButton>
                    )}
                    <ThemeButton
                      onClick={() => {
                        if (!isEqual({ ...values }, initialValues)) {
                          setShowConfirmDialog(true);
                        } else {
                          handleClose();
                        }
                      }}
                    >
                      Close
                    </ThemeButton>
                  </div>
                </div>
                <div className={`main-container`}>
                  <div className="mt-4">
                    <Grid container spacing={2} direction={'column'}>
                      <Grid>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <TextField
                              disabled={!isEdit}
                              variant="outlined"
                              type="text"
                              label="Report Name"
                              required={true}
                              name="name"
                              fullWidth
                              margin="none"
                              size="small"
                              value={values['name']}
                              error={touched['name'] && Boolean(errors['name'])}
                              helperText={touched['name'] && errors['name']}
                              onChange={(e) => setFieldValue('name', e.target.value.trimStart())}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                            <Autocomplete
                              disabled={!isEdit}
                              getOptionLabel={(option) => option.title}
                              isOptionEqualToValue={(option, value) => option.value === value.value}
                              value={
                                resourceOptions?.find((data) => data.value === values['resource'])
                                  ? resourceOptions?.find((data) => data.value === values['resource'])
                                  : null
                              }
                              options={resourceOptions}
                              onChange={(e, val: any) => {
                                setFieldValue('resource', val ? val.value : '');
                                if (!val?.value) {
                                  setPipeline([]);
                                  setHasSortItem(false);
                                  setHasLimitItem(false);
                                  setPipelineErrors({});
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  required={true}
                                  margin="none"
                                  size="small"
                                  name="resource"
                                  label="Resource"
                                  variant="outlined"
                                  error={touched['resource'] && Boolean(errors['resource'])}
                                  helperText={touched['resource'] && errors['resource']}
                                  fullWidth
                                  slotProps={{ inputLabel: { shrink: true } }}
                                />
                              )}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid>
                        <Box mb={3}>
                          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                            <ThemeButton
                              startIcon={<JoinInnerIcon />}
                              onClick={() => addPipelineItem('lookup')}
                              disabled={!isEdit || !values?.resource}
                              buttonType="theme"
                            >
                              Join data
                            </ThemeButton>

                            <ThemeButton
                              startIcon={<FunctionsIcon />}
                              onClick={() => addPipelineItem('group')}
                              disabled={!isEdit || !values?.resource}
                              buttonType="theme"
                            >
                              Summarize
                            </ThemeButton>

                            <ThemeButton
                              startIcon={<SortIcon />}
                              onClick={() => addPipelineItem('sort')}
                              disabled={!isEdit || hasSortItem || !values?.resource}
                              buttonType="theme"
                            >
                              Sort
                            </ThemeButton>

                            <ThemeButton
                              startIcon={<FormatListNumberedIcon />}
                              onClick={() => addPipelineItem('limit')}
                              disabled={!isEdit || hasLimitItem || !values?.resource}
                              buttonType="theme"
                            >
                              Row limit
                            </ThemeButton>
                          </Box>

                          <Box>
                            {pipeline?.map((item) => {
                              switch (item.type) {
                                case 'lookup':
                                  return renderLookupComponent(item as LookupPipeline);
                                case 'group':
                                  return renderGroupComponent(item as GroupPipeline);
                                case 'sort':
                                  return renderSortComponent(item as SortPipeline);
                                case 'limit':
                                  return renderLimitComponent(item as LimitPipeline);
                                default:
                                  return null;
                              }
                            })}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </div>
                </div>
                {showConfirmDialog ? (
                  <ConfirmCancelDialog
                    open={showConfirmDialog}
                    onSave={() => {
                      setShowConfirmDialog(false);
                      submitForm();
                    }}
                    onClose={() => {
                      handleClose();
                    }}
                  />
                ) : null}
              </div>
            </Form>
          );
        }}
      </Formik>
    </>
  ) : null;
}

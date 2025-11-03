import { useState, useContext, useEffect, useCallback, useMemo } from 'react';
import Grid from '@mui/material/Grid2';
import { TextField, Chip, Popper, Paper } from '@mui/material';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { Formik, Form } from 'formik';
import { useParams, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Autocomplete, Box, Card, CardContent, IconButton, Checkbox, FormControlLabel, Typography, ClickAwayListener } from '@mui/material';
import { useData } from '../../StateProvider/Provider';
import ConfirmCancelDialog from '../../components/ConfirmCancelDialog';
import { isEmpty, isEqual } from 'lodash';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { Add, Delete, Sort, FormatListNumbered, JoinInner, Functions, BarChart, ExpandMore, ExpandLess, TableChart } from '@mui/icons-material';
import {
  PipelineItem,
  LookupPipeline,
  GroupPipeline,
  SortPipeline,
  LimitPipeline,
  ChartPipeline,
  FilterPipeline,
  OPERATIONS,
  getUniqueResources,
  validatePipeline,
  chartTypeOptions,
  filterOperations,
  getAvailableFieldsForPipeline,
  getChipLabel,
  MatrixPipeline
} from './utils';
import { sidebarResource, UnCamelCase } from 'src/constants/helpers';
import { BiFilterAlt } from 'react-icons/bi';
import { FilterFieldSelectionDialog, FilterConfigurationDialog } from './Filters';
import FieldSelectionPopper from './FieldSelectionPopper';

const FieldsPopper = ({ isEdit, item, fields, updatePipelineItem, setItemCausingFieldChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const handleToggle = (e) => {
    setAnchorEl(open ? null : e.currentTarget);
  };

  const handleClickAway = (event) => {
    if (anchorEl && !anchorEl.contains(event.target)) {
      setAnchorEl(null);
    }
  };

  return (
    <>
      <IconButton onClick={handleToggle} disabled={!isEdit} size="small" className="border" style={{ borderColor: 'var(--common-border-color)' }}>
        {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
      </IconButton>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <ClickAwayListener onClickAway={handleClickAway}>
          <Paper elevation={4} sx={{ width: 320, maxHeight: 384, overflow: 'auto', p: 2 }}>
            <div className="mb-3">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={(() => {
                      return item?.fields?.length === fields.length && fields.length > 0;
                    })()}
                    indeterminate={(() => {
                      return item?.fields?.length > 0 && item?.fields?.length < fields.length;
                    })()}
                    onChange={(e) => {
                      updatePipelineItem(item._id, { fields: e.target.checked ? fields?.map((f) => f.fieldName) : [] });
                      setItemCausingFieldChange({_id: item._id, ts: Date.now()});
                    }}
                    disabled={!isEdit}
                  />
                }
                label="Select all"
                className="text-sm font-medium"
              />
            </div>

            <div style={{ borderTop: '1px solid var(--common-border-color)' }} className="pt-2">
              {fields?.map((field) => {
                const checked = item?.fields?.includes(field.fieldName);
                return (
                  <div key={field.fieldName} className="mb-1">
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked ? [...item?.fields, field.fieldName] : item?.fields?.filter((f) => f !== field.fieldName);
                            updatePipelineItem(item._id, { fields: next });
                            setItemCausingFieldChange({_id: item._id, ts: Date.now()});
                          }}
                          disabled={!isEdit}
                        />
                      }
                      label={<span className="text-sm">{field.fieldLabel}</span>}
                    />
                  </div>
                );
              })}
              {fields?.length === 0 && (
                <div className="py-4 text-center">
                  <span className="text-sm" style={{ color: 'var(--dark-secondary-text, #6c757d)' }}>
                    No fields available
                  </span>
                </div>
              )}
            </div>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
};

const LookupComponent = ({
  item,
  pipeline,
  pipelineErrors,
  isEdit,
  formValues,
  resourceFieldMap,
  updatePipelineItem,
  removePipelineItem,
  resourceOptions,
  fetchResourceFields,
  itemCausingFieldChange,
  setItemCausingFieldChange
}) => {
  const lookupFields = [{ fieldName: '_id', fieldLabel: '_id' }, ...(resourceFieldMap?.[item?.withResource] || [])];

  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, resourceFieldMap?.[formValues?.resource]);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, resourceFieldMap?.[formValues?.resource]]);

  return (
    <Card key={item._id} sx={{ mb: 2, border: pipelineErrors[item._id]?.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <JoinInner color="primary" />
            <span style={{ fontWeight: 500 }}>Join data</span>
          </Box>
          <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
            <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Box>

        <FieldMatchRow
          availableFields={availableFields}
          item={item}
          matchIndex={0}
          lookupFields={lookupFields}
          onUpdate={(updates) => updatePipelineItem(item._id, updates)}
          totalMatches={item?.fieldToMatch?.length || 0}
          resourceOptions={resourceOptions}
          formValues={formValues}
          isEdit={isEdit}
          fetchResourceFields={fetchResourceFields}
          updatePipelineItem={updatePipelineItem}
          pipelineErrors={pipelineErrors}
          setItemCausingFieldChange={setItemCausingFieldChange}
        />

        {item?.fieldToMatch?.length > 1 &&
          item?.fieldToMatch?.slice(1).map((_, index) => (
            <FieldMatchRow
              key={index + 1}
              item={item}
              matchIndex={index + 1}
              availableFields={availableFields}
              lookupFields={lookupFields}
              onUpdate={(updates) => updatePipelineItem(item._id, updates)}
              onRemove={() => {
                const updatedFieldToMatch = item?.fieldToMatch?.filter((_, i) => i !== index + 1);
                updatePipelineItem(item._id, { fieldToMatch: updatedFieldToMatch });
              }}
              totalMatches={item?.fieldToMatch?.length || 0}
              resourceOptions={resourceOptions}
              formValues={formValues}
              isEdit={isEdit}
              fetchResourceFields={fetchResourceFields}
              updatePipelineItem={updatePipelineItem}
              pipelineErrors={pipelineErrors}
              setItemCausingFieldChange={setItemCausingFieldChange}
            />
          ))}
      </CardContent>
    </Card>
  );
};

const FieldMatchRow = ({
  item,
  matchIndex,
  lookupFields,
  onUpdate,
  onRemove,
  totalMatches,
  resourceOptions,
  formValues,
  isEdit,
  fetchResourceFields,
  updatePipelineItem,
  pipelineErrors,
  availableFields,
  setItemCausingFieldChange
}: {
  item: LookupPipeline;
  matchIndex: number;
  lookupFields: any[];
  onUpdate: (updates: any) => void;
  onRemove?: () => void;
  totalMatches?: number;
  resourceOptions: any[];
  formValues: any;
  isEdit: boolean;
  fetchResourceFields: (resource: string, onFieldsLoaded: (fields: any[]) => void) => void;
  updatePipelineItem: (id: string, updates: Partial<PipelineItem>) => void;
  pipelineErrors: { [itemId: string]: string[] };
  availableFields: any[];
  setItemCausingFieldChange: React.Dispatch<React.SetStateAction<any>>;
}) => {
  const fromResourceName = resourceOptions?.find((r) => r.value === formValues?.resource)?.title || formValues?.resource;
  const withResourceName = resourceOptions?.find((r) => r.value === item.withResource)?.title || item.withResource;

  return (
    <>
      <Grid container spacing={1} alignItems="center" sx={{ mt: matchIndex > 0 ? 1 : 0 }}>
        {matchIndex > 0 && (
          <Grid size={{ xs: 12, sm: 5.5 }}>
            <Box />
          </Grid>
        )}
        {matchIndex === 0 && (
          <>
            <Grid size={{ xs: 12, sm: 2.5 }}>
              <Autocomplete
                disabled={true}
                value={{ title: fromResourceName, value: formValues?.resource }}
                options={[{ title: fromResourceName, value: formValues?.resource }]}
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
            <Grid size={{ xs: 12, sm: 0.5 }} className="flex items-center justify-center">
              <JoinInner color="primary" fontSize="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 2.5 }}>
              <div className="fields-panel-container relative flex items-center gap-2">
                <div className="flex-1">
                  <Autocomplete
                    disabled={!isEdit}
                    value={
                      resourceOptions?.filter((option) => option.value !== formValues?.resource)?.find((r) => r.value === item.withResource) || null
                    }
                    options={resourceOptions?.filter((option) => option.value !== formValues?.resource) || []}
                    getOptionLabel={(option) => option.title}
                    onChange={(e, val) => {
                      const updates: any = {
                        withResource: val?.value || '',
                        fieldToMatch: [{ localField: '', lookupResourceField: '' }],
                        fields: []
                      };

                      onUpdate(updates);

                      if (val?.value) {
                        fetchResourceFields(val.value, (fields) => {
                          const allFieldNames = fields?.map((field) => field?.fieldName);
                          updatePipelineItem(item._id, { fields: allFieldNames });
                        });
                      }

                      setItemCausingFieldChange({_id: item._id, ts: Date.now()});
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
                </div>
                {item?.withResource && (
                  <FieldsPopper
                    isEdit={isEdit}
                    item={item}
                    fields={lookupFields}
                    updatePipelineItem={updatePipelineItem}
                    setItemCausingFieldChange={setItemCausingFieldChange}
                  />
                )}
              </div>
            </Grid>
          </>
        )}
        <Grid size={{ xs: 12, sm: 0.5 }} className="flex items-center justify-center">
          <span className="text-sm font-medium" style={{ color: 'var(--primary-text)' }}>
            {matchIndex === Math.floor(totalMatches / 2) ? 'on' : ' '}
          </span>
        </Grid>
        <Grid size={{ xs: 12, sm: matchIndex > 0 ? 2.5 : 2.5 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box flex={1}>
              <FieldSelectionPopper
                isEdit={isEdit && !!item.withResource}
                availableFields={availableFields}
                selectedFields={availableFields?.filter((f) => f?.fieldName === item?.fieldToMatch?.[matchIndex]?.localField)}
                onFieldSelect={(field) => {
                  const updatedFieldToMatch = [...item.fieldToMatch];
                  updatedFieldToMatch[matchIndex] = { ...updatedFieldToMatch[matchIndex], localField: field?.fieldName || '' };
                  onUpdate({ fieldToMatch: updatedFieldToMatch });
                }}
                textFieldProps={{
                  size: 'small',
                  label: fromResourceName,
                  variant: 'outlined',
                  fullWidth: true,
                  required: true,
                  error: pipelineErrors[item._id]?.includes(`localField_${matchIndex}_required`),
                  helperText: pipelineErrors[item._id]?.includes(`localField_${matchIndex}_required`) ? `${fromResourceName} field is required` : '',
                  slotProps: { inputLabel: { shrink: true } }
                }}
                popperProps={{ width: 350, maxHeight: 300 }}
              />
            </Box>
            <span className="text-lg font-medium" style={{ color: 'var(--primary-text)' }}>
              =
            </span>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: matchIndex > 0 ? 3.5 : 3.5 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box flex={1}>
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
                    label={withResourceName}
                    variant="outlined"
                    fullWidth
                    required
                    error={pipelineErrors[item._id]?.includes(`lookupResourceField_${matchIndex}_required`)}
                    helperText={
                      pipelineErrors[item._id]?.includes(`lookupResourceField_${matchIndex}_required`) ? `${withResourceName} field is required` : ''
                    }
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                )}
              />
            </Box>

            {(totalMatches === 1 || matchIndex === totalMatches - 1) && (
              <IconButton
                onClick={() => {
                  const updatedFieldToMatch = [...item.fieldToMatch, { localField: '', lookupResourceField: '' }];
                  updatePipelineItem(item._id, { fieldToMatch: updatedFieldToMatch });
                }}
                disabled={!isEdit}
                size="small"
                className="border"
                style={{ borderColor: 'var(--common-border-color)' }}
              >
                <Add fontSize="small" />
              </IconButton>
            )}
            {matchIndex !== 0 && (
              <IconButton size="small" onClick={onRemove} disabled={!isEdit}>
                <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
              </IconButton>
            )}
          </Box>
        </Grid>
      </Grid>
      {matchIndex < totalMatches - 1 && (
        <Grid container justifyContent="end" sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'var(--primary-text)' }}>
            and
          </Typography>
        </Grid>
      )}
    </>
  );
};

const AccumulatorRow = ({
  index,
  item,
  accumulator,
  availableFields,
  onUpdate,
  onRemove,
  isEdit,
  onAddOperation,
  setItemCausingFieldChange,
  pipelineErrors
}: {
  index: number;
  item: any;
  accumulator: any;
  availableFields: any[];
  onUpdate: (updates: any) => void;
  onRemove?: () => void | undefined;
  isEdit: boolean;
  onAddOperation: () => void | undefined;
  setItemCausingFieldChange: React.Dispatch<React.SetStateAction<any>>;
  pipelineErrors: any;
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
          setItemCausingFieldChange({_id: item._id, ts: Date.now()});
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Operation"
            variant="outlined"
            fullWidth
            required
            error={pipelineErrors[item._id]?.includes(`operation_${index}_required`)}
            helperText={pipelineErrors[item._id]?.includes(`operation_${index}_required`) ? 'Operation is required' : ''}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}
      />
    </Grid>
    {accumulator?.operation !== 'count' && (
      <Grid size={{ xs: 12, sm: 3 }}>
        <FieldSelectionPopper
          isEdit={isEdit}
          availableFields={availableFields}
          selectedFields={availableFields?.filter(
            (f) => accumulator?.field?.fieldName === f?.fieldName && accumulator?.field?.resource === f?.resource
          )}
          onFieldSelect={(fields) => {
            onUpdate({ field: { fieldName: fields?.fieldName || '', resource: fields?.resource || '', reportFieldName: fields?.reportFieldName } });
            setItemCausingFieldChange({_id: item._id, ts: Date.now()});
          }}
          textFieldProps={{
            size: 'small',
            label: 'Field',
            variant: 'outlined',
            fullWidth: true,
            required: true,
            error: pipelineErrors[item._id]?.includes(`field_${index}_required`),
            helperText: pipelineErrors[item._id]?.includes(`field_${index}_required`) ? 'Field is required' : '',
            slotProps: { inputLabel: { shrink: true } }
          }}
          popperProps={{ width: 400, maxHeight: 400 }}
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
    <Grid size={{ xs: 12, sm: 1 }}>
      {onAddOperation && (
        <IconButton size="small" onClick={onAddOperation} disabled={!isEdit}>
          <Add fontSize="small" />
        </IconButton>
      )}
      {onRemove && (
        <IconButton size="small" onClick={onRemove} disabled={!isEdit}>
          <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
        </IconButton>
      )}
    </Grid>
  </Grid>
);

const SortComponent = ({
  item,
  pipeline,
  pipelineErrors,
  removePipelineItem,
  isEdit,
  formValues,
  mainResourceFields,
  updatePipelineItem,
  itemCausingFieldChange
}) => {
  const itemErrors = pipelineErrors[item._id] || [];

  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, mainResourceFields);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, mainResourceFields]);

  const update = (index: number, field: any) => {
    const updatedFields = [...(item.fields || [])];
    updatedFields[index] = { ...updatedFields[index], ...field };
    updatePipelineItem(item._id, { fields: updatedFields });
  };

  const remove = (index: number) => {
    const updatedFields = (item?.fields || [])?.filter((_, i) => i !== index);
    updatePipelineItem(item._id, { fields: updatedFields });
  };

  const add = () => {
    const updatedFields = [...(item?.fields || []), { fieldName: '', order: 1, resource: '' }];
    updatePipelineItem(item._id, { fields: updatedFields });
  };

  return (
    <Card key={item?._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Sort color="primary" />
            <span style={{ fontWeight: 500 }}>Sort</span>
          </Box>
          <IconButton size="small" onClick={() => removePipelineItem(item?._id)} disabled={!isEdit}>
            <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Box>
        {item?.fields?.map((field, index) => {
          return (
            <Grid container spacing={2} alignItems="center" key={index} mb={2}>
              <Grid size={{ xs: 12, sm: 5.5 }}>
                <FieldSelectionPopper
                  isEdit={isEdit}
                  availableFields={availableFields}
                  selectedFields={availableFields?.filter((f) => f?.fieldName === field.fieldName)}
                  onFieldSelect={(field) => {
                    update(index, { fieldName: field?.fieldName, resource: field?.resource, reportFieldName: field?.reportFieldName });
                  }}
                  textFieldProps={{
                    size: 'small',
                    label: 'Sort Field',
                    variant: 'outlined',
                    fullWidth: true,
                    required: true,
                    error: pipelineErrors[item._id]?.includes(`fieldName_${index}_required`),
                    helperText: pipelineErrors[item._id]?.includes(`fieldName_${index}_required`) ? 'Sort Field is required' : '',
                    slotProps: { inputLabel: { shrink: true } }
                  }}
                  popperProps={{ width: 400, maxHeight: 400 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 5.5 }}>
                <Autocomplete
                  disabled={!isEdit}
                  value={{ value: field.order, label: field.order === 1 ? 'Ascending' : 'Descending' }}
                  disableClearable={true}
                  options={[
                    { value: 1, label: 'Ascending' },
                    { value: -1, label: 'Descending' }
                  ]}
                  getOptionLabel={(option) => option.label}
                  onChange={(e, val) => {
                    update(index, { order: val?.value || 1 });
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
              <Grid size={{ xs: 12, sm: 0.5 }}>
                <IconButton
                  onClick={() => {
                    add();
                  }}
                  disabled={!isEdit}
                  size="small"
                  className="border"
                  style={{ borderColor: 'var(--common-border-color)' }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Grid>
              {index !== 0 && (
                <Grid size={{ xs: 12, sm: 0.5 }}>
                  <IconButton size="small" onClick={() => remove(index)} disabled={!isEdit}>
                    <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
                  </IconButton>
                </Grid>
              )}
            </Grid>
          );
        })}
      </CardContent>
    </Card>
  );
};

const ChartComponent = ({ item, pipeline, pipelineErrors, isEdit, formValues, mainResourceFields, updatePipelineItem, itemCausingFieldChange }) => {
  const itemErrors = pipelineErrors[item._id] || [];

  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, mainResourceFields);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, mainResourceFields]);

  return (
    <Card key={item._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <BarChart color="primary" />
          <span style={{ fontWeight: 500 }}>Chart</span>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Autocomplete
              disabled={!isEdit}
              value={chartTypeOptions.find((option) => option.optionValue === item.chartType) || null}
              options={chartTypeOptions}
              getOptionLabel={(option) => option.optionLabel}
              onChange={(e, val) => {
                if (['bar', 'line'].includes(val?.optionValue)) {
                  updatePipelineItem(item._id, {
                    chartType: val?.optionValue,
                    xAxis: { field: '', label: '', resource: '' },
                    yAxis: { field: '', label: '', resource: '' },
                    value: undefined,
                    label: undefined
                  });
                } else if (val?.optionValue === 'pie') {
                  updatePipelineItem(item._id, {
                    chartType: 'pie',
                    value: { field: '', resource: '' },
                    label: { field: '', resource: '' },
                    xAxis: undefined,
                    yAxis: undefined
                  });
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  label="Chart Type"
                  variant="outlined"
                  fullWidth
                  required
                  error={itemErrors.includes('chartType_required')}
                  helperText={itemErrors.includes('chartType_required') ? 'Chart Type is required' : ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>

          {['bar', 'line'].includes(item.chartType) && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldSelectionPopper
                  isEdit={isEdit}
                  availableFields={availableFields}
                  selectedFields={availableFields?.filter((f) => f?.fieldName === item.xAxis?.field)}
                  onFieldSelect={(field) => {
                    updatePipelineItem(item._id, {
                      xAxis: { ...item.xAxis, field: field.fieldName, resource: field.resource, reportFieldName: field.reportFieldName }
                    });
                  }}
                  textFieldProps={{
                    size: 'small',
                    label: 'X-Axis Field',
                    variant: 'outlined',
                    fullWidth: true,
                    required: true,
                    error: itemErrors.includes('xAxis_field_required'),
                    helperText: itemErrors.includes('xAxis_field_required') ? 'X-Axis Field is required' : '',
                    slotProps: { inputLabel: { shrink: true } }
                  }}
                  popperProps={{ width: 400, maxHeight: 400 }}
                />
              </Grid>
              {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  disabled={!isEdit}
                  size="small"
                  label="X-Axis Label"
                  variant="outlined"
                  fullWidth
                  required
                  value={item.xAxis?.label || ''}
                  error={itemErrors.includes('xAxis_label_required')}
                  helperText={itemErrors.includes('xAxis_label_required') ? 'X-Axis Label is required' : ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(e) => {
                    updatePipelineItem(item._id, {
                      xAxis: { ...item.xAxis, label: e.target.value }
                    });
                  }}
                />
              </Grid> */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FieldSelectionPopper
                  isEdit={isEdit}
                  availableFields={availableFields}
                  selectedFields={availableFields?.filter((f) => f?.fieldName === item.yAxis?.field)}
                  onFieldSelect={(field) => {
                    updatePipelineItem(item._id, { yAxis: { ...item.yAxis, field: field.fieldName, resource: field.resource } });
                  }}
                  textFieldProps={{
                    size: 'small',
                    label: 'Y-Axis Field',
                    variant: 'outlined',
                    fullWidth: true,
                    required: true,
                    error: itemErrors.includes('yAxis_field_required'),
                    helperText: itemErrors.includes('yAxis_field_required') ? 'Y-Axis Field is required' : '',
                    slotProps: { inputLabel: { shrink: true } }
                  }}
                  popperProps={{ width: 400, maxHeight: 400 }}
                />
              </Grid>
              {/* <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  disabled={!isEdit}
                  size="small"
                  label="Y-Axis Label"
                  variant="outlined"
                  fullWidth
                  required
                  value={item.yAxis?.label || ''}
                  error={itemErrors.includes('yAxis_label_required')}
                  helperText={itemErrors.includes('yAxis_label_required') ? 'Y-Axis Label is required' : ''}
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(e) => {
                    updatePipelineItem(item._id, {
                      yAxis: { ...item.yAxis, label: e.target.value }
                    });
                  }}
                />
              </Grid> */}
            </>
          )}

          {item.chartType === 'pie' && (
            <>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldSelectionPopper
                  isEdit={isEdit}
                  availableFields={availableFields}
                  selectedFields={availableFields?.filter((f) => f?.fieldName === item.value?.field)}
                  onFieldSelect={(field) => {
                    updatePipelineItem(item._id, {
                      value: { field: field.fieldName, resource: field.resource, reportFieldName: field.reportFieldName }
                    });
                  }}
                  textFieldProps={{
                    size: 'small',
                    label: 'Value Field',
                    variant: 'outlined',
                    fullWidth: true,
                    required: true,
                    error: itemErrors.includes('value_required'),
                    helperText: itemErrors.includes('value_required') ? 'Value Field is required' : '',
                    slotProps: { inputLabel: { shrink: true } }
                  }}
                  popperProps={{ width: 400, maxHeight: 400 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <FieldSelectionPopper
                  isEdit={isEdit}
                  availableFields={availableFields}
                  selectedFields={availableFields?.filter((f) => f?.fieldName === item.label?.field)}
                  onFieldSelect={(field) => {
                    updatePipelineItem(item._id, {
                      label: { field: field.fieldName, resource: field.resource, reportFieldName: field.reportFieldName }
                    });
                  }}
                  textFieldProps={{
                    size: 'small',
                    label: 'Label Field',
                    variant: 'outlined',
                    fullWidth: true,
                    required: true,
                    error: itemErrors.includes('label_required'),
                    helperText: itemErrors.includes('label_required') ? 'Label Field is required' : '',
                    slotProps: { inputLabel: { shrink: true } }
                  }}
                  popperProps={{ width: 400, maxHeight: 400 }}
                />
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

const FilterComponent = ({
  item,
  pipeline,
  isEdit,
  formValues,
  mainResourceFields,
  updatePipelineItem,
  removePipelineItem,
  setFilterFieldSelect,
  setFilterConfigurationDialog,
  itemCausingFieldChange
}) => {
  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, mainResourceFields);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, mainResourceFields]);

  const handleRemoveFilter = (filterIndex: number) => {
    const updatedFields = item?.fields?.filter((_, index) => index !== filterIndex);
    updatePipelineItem(item._id, { fields: updatedFields });
  };

  return (
    <Card key={item._id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <BiFilterAlt color="var(--theme-primary)" />
            <span style={{ fontWeight: 500 }}>Filter</span>
          </Box>
          <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
            <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Box>

        <Box className="flex flex-wrap items-center gap-2">
          {item?.fields?.map((filter, index) => {
            const field = availableFields.find((f) => f.fieldName === filter.fieldName);
            const operation = filterOperations.find((op) => op.optionValue === filter.operation);

            const handleChipClick = () => {
              if (!isEdit) return;

              const fieldForEdit = availableFields.find((f) => f.fieldName === filter.fieldName);
              setFilterFieldSelect({ open: false, item: item });
              setFilterConfigurationDialog({
                open: true,
                field: fieldForEdit,
                editingFilter: filter,
                editingIndex: index
              });
            };

            return (
              <Chip
                key={index}
                label={getChipLabel(field, filter, operation)}
                onDelete={isEdit ? () => handleRemoveFilter(index) : undefined}
                onClick={handleChipClick}
                className={`filter-chip ${isEdit ? 'cursor-pointer' : ''}`}
                clickable={isEdit}
              />
            );
          })}

          {!item?.fields?.length ? (
            <ThemeButton startIcon={<Add />} onClick={() => setFilterFieldSelect({ open: true, item: item })} disabled={!isEdit} buttonType="theme">
              Add Filters
            </ThemeButton>
          ) : (
            <IconButton onClick={() => setFilterFieldSelect({ open: true, item: item })} disabled={!isEdit}>
              <Add fontSize="small" color={!isEdit ? 'disabled' : 'primary'} />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const GroupComponent = ({
  item,
  pipeline,
  isEdit,
  formValues,
  mainResourceFields,
  updatePipelineItem,
  removePipelineItem,
  pipelineErrors,
  itemCausingFieldChange,
  setItemCausingFieldChange
}) => {
  const itemErrors = pipelineErrors[item._id] || [];

  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, mainResourceFields);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, mainResourceFields]);

  return (
    <Card key={item._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Functions color="primary" />
            <span style={{ fontWeight: 500 }}>Summarize</span>
          </Box>
          <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
            <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Box>

        {item?.accumulator?.map((acc, index) => (
          <AccumulatorRow
            index={index}
            key={index}
            item={item}
            accumulator={acc}
            availableFields={availableFields}
            isEdit={isEdit}
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
            onAddOperation={
              index === item?.accumulator?.length - 1
                ? () => {
                  const updatedAccumulator = [...item.accumulator, { field: '', operation: '', outputField: '' }];
                  updatePipelineItem(item._id, { accumulator: updatedAccumulator });
                }
                : undefined
            }
            setItemCausingFieldChange={setItemCausingFieldChange}
            pipelineErrors={pipelineErrors}
          />
        ))}

        <Box>
          <span>Group By</span>
          <Box mt={2} />
          <FieldSelectionPopper
            multiple={true}
            isEdit={isEdit}
            availableFields={availableFields}
            selectedFields={availableFields?.filter((f) =>
              item?.fields?.some((field) => field.fieldName === f.fieldName && field.resource === f.resource)
            )}
            onFieldSelect={(fields) => {
              updatePipelineItem(item._id, {
                fields: fields?.map((f) => {
                  return {
                    fieldName: f.fieldName,
                    resource: f.resource,
                    reportFieldName: f.reportFieldName
                  };
                })
              });
              setItemCausingFieldChange({_id: item._id, ts: Date.now()});
            }}
            textFieldProps={{
              size: 'small',
              label: 'Select Fields',
              variant: 'outlined',
              fullWidth: true,
              required: true,
              error: pipelineErrors[item._id]?.includes('fields_required'),
              helperText: pipelineErrors[item._id]?.includes('fields_required') ? 'Group by fields are required' : '',
              slotProps: { inputLabel: { shrink: true } }
            }}
            popperProps={{ width: 400, maxHeight: 400 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const MatrixComponent = ({
  item,
  pipeline,
  isEdit,
  formValues,
  mainResourceFields,
  updatePipelineItem,
  removePipelineItem,
  pipelineErrors,
  itemCausingFieldChange
}) => {
  const itemErrors = pipelineErrors[item._id] || [];

  const [availableFields, setAvailableFields] = useState<any[]>([]);

  const upstreamPipeline = useMemo(() => {
    const idx = pipeline?.findIndex((p) => p._id === item?._id);
    return pipeline?.slice(0, idx) || [];
  }, [pipeline, item?._id]);

  useEffect(() => {
    const fetchFields = async () => {
      const fields = await getAvailableFieldsForPipeline(upstreamPipeline, formValues?.resource, mainResourceFields);
      setAvailableFields(fields || []);
    };
    if (!upstreamPipeline?.length || !itemCausingFieldChange?._id || upstreamPipeline?.some((p) => p._id === itemCausingFieldChange?._id)) {
      fetchFields();
    }
  }, [itemCausingFieldChange, formValues?.resource, mainResourceFields]);

  return (
    <Card key={item._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <TableChart color="primary" />
            <span style={{ fontWeight: 500 }}>Matrix</span>
          </Box>
          <IconButton size="small" onClick={() => removePipelineItem(item._id)} disabled={!isEdit}>
            <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
          </IconButton>
        </Box>
        <Grid container spacing={1} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FieldSelectionPopper
              isEdit={isEdit}
              availableFields={availableFields}
              selectedFields={availableFields?.filter((f) =>
                item?.rows?.some((field) => field.fieldName === f.fieldName && field.resource === f.resource)
              )}
              onFieldSelect={(field) => {
                updatePipelineItem(item._id, {
                  rows: [{ fieldName: field?.fieldName || '', resource: field?.resource || '', reportFieldName: field?.reportFieldName }]
                });
              }}
              textFieldProps={{
                size: 'small',
                label: 'Select Row',
                variant: 'outlined',
                fullWidth: true,
                required: true,
                error: pipelineErrors[item._id]?.includes(`rows_required`),
                helperText: pipelineErrors[item._id]?.includes(`rows_required`) ? 'Rows are required' : '',
                slotProps: { inputLabel: { shrink: true } }
              }}
              popperProps={{ width: 400, maxHeight: 400 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FieldSelectionPopper
              isEdit={isEdit}
              availableFields={availableFields}
              selectedFields={availableFields?.filter((f) =>
                item?.columns?.some((field) => field.fieldName === f.fieldName && field.resource === f.resource)
              )}
              onFieldSelect={(field) => {
                updatePipelineItem(item._id, {
                  columns: [{ fieldName: field?.fieldName || '', resource: field?.resource || '', reportFieldName: field?.reportFieldName }]
                });
              }}
              textFieldProps={{
                size: 'small',
                label: 'Select Column',
                variant: 'outlined',
                fullWidth: true,
                required: true,
                error: pipelineErrors[item._id]?.includes(`columns_required`),
                helperText: pipelineErrors[item._id]?.includes(`columns_required`) ? 'Columns are required' : '',
                slotProps: { inputLabel: { shrink: true } }
              }}
              popperProps={{ width: 400, maxHeight: 400 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FieldSelectionPopper
              multiple={true}
              isEdit={isEdit}
              availableFields={availableFields}
              selectedFields={availableFields?.filter((f) =>
                item?.values?.some((field) => field.fieldName === f.fieldName && field.resource === f.resource)
              )}
              onFieldSelect={(fields) => {
                updatePipelineItem(item._id, {
                  values: fields?.map((f) => ({ fieldName: f?.fieldName || '', resource: f?.resource || '', reportFieldName: f?.reportFieldName }))
                });
              }}
              textFieldProps={{
                size: 'small',
                label: 'Select Values',
                variant: 'outlined',
                fullWidth: true,
                required: true,
                error: pipelineErrors[item._id]?.includes(`values_required`),
                helperText: pipelineErrors[item._id]?.includes(`values_required`) ? 'Values are required' : '',
                slotProps: { inputLabel: { shrink: true } }
              }}
              popperProps={{ width: 400, maxHeight: 400 }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

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
  const [isEdit, setIsEdit] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [hasSortItem, setHasSortItem] = useState(false);
  const [hasLimitItem, setHasLimitItem] = useState(false);
  const [hasMatrixItem, setHasMatrixItem] = useState(false);
  const [pipelineErrors, setPipelineErrors] = useState<{ [itemId: string]: string[] }>({});
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [filterFieldSelect, setFilterFieldSelect] = useState({ open: false, item: null });
  const [filterConfigurationDialog, setFilterConfigurationDialog] = useState({ open: false, field: null, editingFilter: null, editingIndex: null });
  const [itemCausingFieldChange, setItemCausingFieldChange] = useState({_id: null, ts: null});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFieldsPanel && !(event.target as Element).closest('.fields-panel-container')) {
        setShowFieldsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFieldsPanel]);

  const onBackButtonEvent = useCallback((e) => {
    e.preventDefault();
    window.history.pushState(null, null, window.location.pathname);
    setShowConfirmDialog(true);
  }, []);

  const fetchResourceFields = useCallback(
    async (resource, onFieldsLoaded) => {
      try {
        if (resourceFieldMap?.hasOwnProperty(resource)) {
          if (onFieldsLoaded) {
            onFieldsLoaded(resourceFieldMap[resource]);
          }
          return;
        }
        const {
          data: { data }
        } = await axiosInstance().get(`/field?resource=${resource}`);

        const fields = data?.filter((e) => e.isRead)?.map((e) => e.fieldData);
        setResourceFieldMap((prev) => ({
          ...prev,
          [resource]: fields
        }));

        if (onFieldsLoaded) {
          onFieldsLoaded(fields);
        }
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    },
    [resourceFieldMap, toastConfig]
  );

  const validateAndCleanFields = useCallback((selectedFields: string[], availableFields) => {
    if (!availableFields || !availableFields?.length) {
      return [];
    }

    const availableFieldNames = availableFields.map((field) => field?.fieldName);

    return selectedFields?.filter((fieldName) => availableFieldNames.includes(fieldName));
  }, []);

  const fetchData = async () => {
    const initialValues = {
      name: '',
      resource: '',
      fields: [],
      pipeline: [],
      type: 'report'
    };

    try {
      const res = await axiosInstance().get(`/report-builder/${id}`);
      const {
        data: { data }
      } = res;
      initialValues.resource = data?.resource;
      initialValues.fields = data?.fields || [];
      initialValues.pipeline = data?.pipeline || [];
      initialValues.name = data?.name;
      initialValues.type = data?.type;

      setPipeline(data?.pipeline || []);

      setHasSortItem((data?.pipeline || []).some((item) => item.type === 'sort'));
      setHasLimitItem((data?.pipeline || []).some((item) => item.type === 'limit'));

      const uniqueResources = getUniqueResources(data?.pipeline || [], data?.resource);
      uniqueResources?.forEach((resource) => fetchResourceFields(resource, null));
    } catch (e) {
      toastConfig.setToastConfig(e);
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
      options.push({ title: title, value: sidebarResource[key] || title });
    }
    setresourceOptions(options);
  }, [permissions, resources]);

  useEffect(() => {
    if (formValues && formValues?.resource) {
      fetchResourceFields(formValues?.resource, (fields) => {
        const allFieldNames = fields?.map((field) => field?.fieldName);
        if (!formValues?.fields?.length) {
          setInitialValues({ ...initialValues, fields: allFieldNames });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (formValues?.type === 'report') {
      setPipeline((prev) => prev.filter((item) => item.type !== 'chart'));
    } else if (formValues?.type === 'kpi') {
      const hasChart = pipeline?.some((item) => item.type === 'chart');
      if (!hasChart) {
        const chartItem: ChartPipeline = {
          _id: `chart-${Date.now()}`,
          type: 'chart',
          chartType: 'bar',
          xAxis: { field: '', label: '', resource: '' },
          yAxis: { field: '', label: '', resource: '' }
        };
        setPipeline((prev) => [...prev, chartItem]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues?.type]);

  const generateId = (type: string) => `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addPipelineItem = (type: 'lookup' | 'group' | 'sort' | 'limit' | 'filter' | 'matrix') => {
    const _id = generateId(type);
    let newItem: PipelineItem;

    switch (type) {
      case 'lookup':
        newItem = {
          _id,
          type: 'lookup',
          withResource: '',
          fieldToMatch: [{ localField: '', lookupResourceField: '' }],
          fields: []
        } as LookupPipeline;
        break;
      case 'group':
        newItem = {
          _id,
          type: 'group',
          fields: [],
          accumulator: [{ field: { fieldName: '', resource: '' }, operation: '', outputField: '' }]
        } as GroupPipeline;
        break;
      case 'sort':
        newItem = {
          _id,
          type: 'sort',
          fields: [{ fieldName: '', order: 1, resource: '' }]
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
      case 'filter':
        newItem = {
          _id,
          type: 'filter',
          fields: []
        } as FilterPipeline;
        break;
      case 'matrix':
        newItem = {
          _id,
          type: 'matrix',
          rows: [],
          columns: [],
          values: []
        } as MatrixPipeline;
        setHasMatrixItem(true);
        break;
      default:
        return;
    }

    setPipeline((prev) => {
      const chartIndex = prev.findIndex((item) => item.type === 'chart');
      let newPipeline = [...prev];

      if (chartIndex !== -1) {
        newPipeline.splice(chartIndex, 0, newItem);
      } else {
        newPipeline.push(newItem);
      }

      const matrixItem = newPipeline?.find((i) => i?.type === 'matrix');
      if (matrixItem) {
        newPipeline = newPipeline?.filter((i) => i?.type !== 'matrix');
        newPipeline?.push(matrixItem);
      }

      setItemCausingFieldChange({_id: newPipeline?.[newPipeline?.length - 2]?._id, ts: Date.now()});
      return newPipeline;
    });
  };

  const updatePipelineItem = (id: string, updates: Partial<PipelineItem>) => {
    setPipeline((prev) => prev?.map((item) => (item?._id === id ? { ...item, ...updates } : item)));
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
      if (removedItem?.type === 'matrix') {
        setHasMatrixItem(false);
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

    const submitData: any = {
      _id: id,
      pipeline: pipeline,
      fields: values?.fields
    };

    axiosInstance()
      .post('/report-builder/pipeline', submitData)
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
  };

  const handleClose = (path?: string) => {
    history.push({ pathname: isBreakCrumbPath || path ? isBreakCrumbPath || path : routes.reportBuilder.path });
  };

  const renderLimitComponent = (item: LimitPipeline) => {
    const itemErrors = pipelineErrors[item._id] || [];

    return (
      <Card key={item?._id} sx={{ mb: 2, border: itemErrors.length > 0 ? '1px solid' : 'none', borderColor: 'error.main' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <FormatListNumbered color="primary" />
              <span style={{ fontWeight: 500 }}>Row limit</span>
            </Box>
            <IconButton size="small" onClick={() => removePipelineItem(item?._id)} disabled={!isEdit}>
              <Delete fontSize="small" color={!isEdit ? 'disabled' : 'error'} />
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

  const handleAddFilterToPipeline = (filter: { fieldName: string; operation: string; value: any; type: string; resource: string }) => {
    const currentFilter = pipeline?.find((p) => p?._id === filterFieldSelect?.item?._id) as FilterPipeline;
    if (isEmpty(currentFilter)) return;
    let updatedFields = [...(currentFilter?.fields || [])];
    if (filterConfigurationDialog?.editingIndex !== null) {
      updatedFields[filterConfigurationDialog?.editingIndex] = filter;
    } else {
      updatedFields.push(filter);
    }

    updatePipelineItem(filterFieldSelect?.item._id, { fields: updatedFields });
    setFilterConfigurationDialog({ open: false, field: null, editingFilter: null, editingIndex: null });
    setFilterFieldSelect({ open: false, item: null });
  };

  return initialValues ? (
    <>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize={true}>
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
                          title: initialValues && initialValues?.name
                        }
                      ]}
                      isConfirmBeforeClick={true}
                      onBreadCrumbClick={(path) => {
                        setIsBreakCrumbPath(path);
                        if (!isEqual({ ...values }, initialValues)) {
                          setShowConfirmDialog(true);
                        } else {
                          handleClose(path);
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
                          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 4 }}>
                            <Card sx={{ overflow: 'visible' }}>
                              <CardContent sx={{ overflow: 'visible', position: 'relative' }}>
                                <div className="fields-panel-container relative flex items-center gap-2">
                                  <div className="flex-1">
                                    <Autocomplete
                                      disabled={true}
                                      getOptionLabel={(option) => option.title}
                                      isOptionEqualToValue={(option, value) => option.value === value.value}
                                      value={
                                        resourceOptions?.find((data) => data.value === values['resource'])
                                          ? resourceOptions?.find((data) => data.value === values['resource'])
                                          : null
                                      }
                                      options={resourceOptions}
                                      onChange={(e, val: any) => { }}
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
                                  </div>
                                  <IconButton
                                    onClick={() => setShowFieldsPanel(!showFieldsPanel)}
                                    disabled={!values?.resource}
                                    size="small"
                                    className="border"
                                    style={{ borderColor: 'var(--common-border-color)' }}
                                  >
                                    {showFieldsPanel ? <ExpandLess /> : <ExpandMore />}
                                  </IconButton>

                                  {showFieldsPanel && values?.resource && (
                                    <div
                                      className="absolute left-0 top-full z-50 mt-1 max-h-96 w-80 overflow-auto rounded border shadow-lg"
                                      style={{
                                        backgroundColor: 'var(--card-bg)',
                                        borderColor: 'var(--common-border-color)'
                                      }}
                                    >
                                      <div className="p-3">
                                        <div className="mb-3">
                                          <FormControlLabel
                                            control={
                                              <Checkbox
                                                size="small"
                                                checked={(() => {
                                                  const availableFields = resourceFieldMap?.[values?.resource] || [];
                                                  return values?.fields?.length === availableFields?.length && availableFields?.length > 0;
                                                })()}
                                                indeterminate={(() => {
                                                  const availableFields = resourceFieldMap?.[values?.resource] || [];
                                                  return values?.fields?.length > 0 && values?.fields?.length < availableFields?.length;
                                                })()}
                                                onChange={(e) => {
                                                  const availableFields = resourceFieldMap?.[values?.resource] || [];
                                                  if (e.target.checked) {
                                                    setFieldValue(
                                                      'fields',
                                                      availableFields?.map((f) => f.fieldName)
                                                    );
                                                  } else {
                                                    setFieldValue('fields', []);
                                                  }
                                                }}
                                                disabled={!isEdit}
                                              />
                                            }
                                            label="Select all"
                                            className="text-sm font-medium"
                                          />
                                        </div>

                                        <div className="pt-2" style={{ borderTop: '1px solid var(--common-border-color)' }}>
                                          {(resourceFieldMap?.[values?.resource] || [])?.map((field) => (
                                            <div key={field.fieldName} className="mb-1">
                                              <FormControlLabel
                                                control={
                                                  <Checkbox
                                                    size="small"
                                                    checked={(() => {
                                                      const availableFields = resourceFieldMap?.[values?.resource] || [];
                                                      const validFields = validateAndCleanFields(values?.fields, availableFields);
                                                      return validFields.includes(field.fieldName);
                                                    })()}
                                                    onChange={(e) => {
                                                      const availableFields = resourceFieldMap?.[values?.resource] || [];
                                                      const validFields = validateAndCleanFields(values?.fields, availableFields);
                                                      let newFields;
                                                      if (e?.target?.checked) {
                                                        newFields = [...validFields, field.fieldName];
                                                      } else {
                                                        newFields = validFields?.filter((f) => f !== field.fieldName);
                                                      }
                                                      setFieldValue('fields', newFields);
                                                    }}
                                                    disabled={!isEdit}
                                                  />
                                                }
                                                label={
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm">{field.fieldLabel}</span>
                                                  </div>
                                                }
                                              />
                                            </div>
                                          ))}

                                          {!(resourceFieldMap?.[values?.resource] || [])?.length && (
                                            <div className="py-4 text-center">
                                              <span className="text-sm" style={{ color: 'var(--dark-secondary-text, #6c757d)' }}>
                                                No fields available
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </Grid>

                      <Grid>
                        <Box>
                          {pipeline?.map((item) => {
                            switch (item.type) {
                              case 'lookup':
                                return (
                                  <LookupComponent
                                    item={item}
                                    pipeline={pipeline}
                                    pipelineErrors={pipelineErrors}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    resourceFieldMap={resourceFieldMap}
                                    updatePipelineItem={updatePipelineItem}
                                    removePipelineItem={removePipelineItem}
                                    resourceOptions={resourceOptions}
                                    fetchResourceFields={fetchResourceFields}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                    setItemCausingFieldChange={setItemCausingFieldChange}
                                  />
                                );
                              case 'group':
                                return (
                                  <GroupComponent
                                    item={item}
                                    pipeline={pipeline}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    mainResourceFields={resourceFieldMap?.[formValues?.resource]}
                                    updatePipelineItem={updatePipelineItem}
                                    removePipelineItem={removePipelineItem}
                                    pipelineErrors={pipelineErrors}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                    setItemCausingFieldChange={setItemCausingFieldChange}
                                  />
                                );
                              case 'filter':
                                return (
                                  <FilterComponent
                                    item={item}
                                    pipeline={pipeline}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    mainResourceFields={resourceFieldMap?.[formValues?.resource]}
                                    updatePipelineItem={updatePipelineItem}
                                    removePipelineItem={removePipelineItem}
                                    setFilterFieldSelect={setFilterFieldSelect}
                                    setFilterConfigurationDialog={setFilterConfigurationDialog}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                  />
                                );
                              case 'sort':
                                return (
                                  <SortComponent
                                    item={item}
                                    pipeline={pipeline}
                                    pipelineErrors={pipelineErrors}
                                    removePipelineItem={removePipelineItem}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    mainResourceFields={resourceFieldMap?.[formValues?.resource]}
                                    updatePipelineItem={updatePipelineItem}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                  />
                                );
                              case 'limit':
                                return renderLimitComponent(item as LimitPipeline);
                              case 'chart':
                                return (
                                  <ChartComponent
                                    item={item}
                                    pipeline={pipeline}
                                    pipelineErrors={pipelineErrors}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    mainResourceFields={resourceFieldMap?.[formValues?.resource]}
                                    updatePipelineItem={updatePipelineItem}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                  />
                                );
                              case 'matrix':
                                return (
                                  <MatrixComponent
                                    item={item}
                                    pipeline={pipeline}
                                    pipelineErrors={pipelineErrors}
                                    isEdit={isEdit}
                                    formValues={formValues}
                                    mainResourceFields={resourceFieldMap?.[formValues?.resource]}
                                    updatePipelineItem={updatePipelineItem}
                                    removePipelineItem={removePipelineItem}
                                    itemCausingFieldChange={itemCausingFieldChange}
                                  />
                                );
                              default:
                                return null;
                            }
                          })}
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 8, md: 8, lg: 8 }}>
                        <Box className="mr-2 flex flex-wrap justify-start gap-3">
                          <ThemeButton
                            startIcon={<JoinInner />}
                            onClick={() => addPipelineItem('lookup')}
                            disabled={!isEdit || !values?.resource}
                            buttonType="theme"
                          >
                            Join data
                          </ThemeButton>

                          <ThemeButton
                            startIcon={<Functions />}
                            onClick={() => addPipelineItem('group')}
                            disabled={!isEdit || !values?.resource}
                            buttonType="theme"
                          >
                            Summarize
                          </ThemeButton>
                          <ThemeButton
                            startIcon={<BiFilterAlt />}
                            onClick={() => addPipelineItem('filter')}
                            disabled={
                              !isEdit ||
                              !values?.resource ||
                              !(
                                pipeline?.length === 0 ||
                                (values?.type === 'report' && ['lookup', 'group'].includes(pipeline?.[pipeline?.length - 1]?.type)) ||
                                (values?.type === 'kpi' && ['lookup', 'group'].includes(pipeline?.[pipeline?.length - 2]?.type))
                              )
                            }
                            buttonType="theme"
                          >
                            Filters
                          </ThemeButton>

                          {values?.type === 'report' && (
                            <ThemeButton
                              startIcon={<TableChart />}
                              onClick={() => addPipelineItem('matrix')}
                              disabled={!isEdit || !values?.resource || hasMatrixItem}
                              buttonType="theme"
                            >
                              Matrix
                            </ThemeButton>
                          )}

                          <ThemeButton
                            startIcon={<Sort />}
                            onClick={() => addPipelineItem('sort')}
                            disabled={!isEdit || hasSortItem || !values?.resource}
                            buttonType="theme"
                          >
                            Sort
                          </ThemeButton>

                          <ThemeButton
                            startIcon={<FormatListNumbered />}
                            onClick={() => addPipelineItem('limit')}
                            disabled={!isEdit || hasLimitItem || !values?.resource}
                            buttonType="theme"
                          >
                            Row limit
                          </ThemeButton>
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

      {filterFieldSelect?.open && (
        <FilterFieldSelectionDialog
          open={filterFieldSelect?.open}
          onClose={() => setFilterFieldSelect({ open: false, item: null })}
          onFieldSelect={(field: any) => {
            setFilterConfigurationDialog({ open: true, field: field, editingFilter: null, editingIndex: null });
          }}
          pipeline={pipeline}
          item={filterFieldSelect?.item}
          mainResource={formValues?.resource}
          mainResourceFields={resourceFieldMap?.[formValues?.resource]}
        />
      )}

      {filterConfigurationDialog?.open && (
        <FilterConfigurationDialog
          open={filterConfigurationDialog?.open}
          onClose={() => setFilterConfigurationDialog({ open: false, field: null, editingFilter: null, editingIndex: null })}
          onAddFilter={handleAddFilterToPipeline}
          selectedField={filterConfigurationDialog?.field}
          filterData={filterConfigurationDialog?.editingFilter}
        />
      )}
    </>
  ) : null;
}

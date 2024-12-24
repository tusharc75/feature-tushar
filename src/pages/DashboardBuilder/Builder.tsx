import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, Radio, RadioGroup, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { makeStyles } from '@mui/styles';
import { camelCase, startCase } from 'lodash';
import React from 'react';

import axiosInstance from 'src/axios/axiosInstance';
import { generateId } from 'src/constants/helpers';
import { CHART_TYPES, GRAPH_TYPES, IFormDataType, KPIListType, defaultFormConfigs, statuses } from './builderHelpers';

const useClasses = makeStyles(() => ({
  column: {
    flexDirection: 'row'
  }
}));

interface Props {
  setFormData: React.Dispatch<React.SetStateAction<IFormDataType[]>>;
  selectedData: IFormDataType;
  handleUpdate: (data: IFormDataType) => void;
}

const Builder = (props: Props) => {
  const { setFormData, selectedData, handleUpdate } = props;

  const [formValues, setFormValues] = React.useState<IFormDataType>(defaultFormConfigs);
  const [errors, setErrors] = React.useState(null);
  const [kpiLists, setKpiLists] = React.useState([]);

  const classes = useClasses();

  React.useEffect(() => {
    if (selectedData) {
      setFormValues(selectedData);
    } else {
      setFormValues(defaultFormConfigs);
    }
  }, [selectedData]);

  React.useEffect(() => {
    if (!formValues.kpi?.kpi && !formValues.filters.map((k) => k.key).includes('status')) return;
    setFormValues((prevState) => ({ ...prevState, statusOptions: statuses[formValues.kpi?.kpi] }));
  }, [formValues.kpi, formValues.filters]);

  const fetchKpis = () => {
    axiosInstance()
      .get(`dashboard-master/kpi-list`)
      .then(({ data: { data } }) => {
        setKpiLists(data);
      })
      .catch((err) => {});
  };

  React.useEffect(fetchKpis, []);

  const handleChange = (name: string, val: any) => {
    setFormValues((prevState) => ({ ...prevState, [name]: val }));
  };

  const addFormConfigs = () => {
    const hasErrors = findErrors();
    if (hasErrors) return;

    if (selectedData) {
      handleUpdate(formValues);
    } else {
      const formedData = { uniqueId: `${camelCase(formValues.chartTitle)}_${generateId()}`, ...formValues };
      setFormData((prevState: any) => [...prevState, formedData]);
      setFormValues(defaultFormConfigs);
    }
  };

  const findErrors = () => {
    let errorObject: any = {};

    if (!formValues.graphType) {
      errorObject.graphType = 'Required Field';
    }

    if (!formValues.chartTitle) {
      errorObject.chartTitle = 'Required Field';
    }

    if (formValues.graphType === 'Chart' && !formValues.chartType) {
      errorObject.chartType = 'Required Field';
    }

    if (formValues.hasFilters && formValues.filters.length === 0) {
      errorObject.filters = 'Required Field';
    }

    const err = Object.keys(errorObject).length > 0 ? errorObject : null;
    setErrors(err);

    return Boolean(err);
  };

  return (
    <Box className={'container-with-border'} p={2}>
      <div>
        <Box>
          <Autocomplete
            size="small"
            options={kpiLists}
            value={formValues.kpi}
            groupBy={(option) => option.resource}
            onChange={(_, val: KPIListType) => {
              handleChange('kpi', val);
              setFormValues((prevState) => ({
                ...prevState,
                chartType: val && val.hasOwnProperty('chartType') ? startCase(val?.chartType[0]) : '',
                graphType: val?.custom ? 'Custom' : val && val.hasOwnProperty('graphType') ? startCase(val?.graphType[0]) : '',
                chartTitle: val?.name || '',
                hasFilters: val?.filters?.length > 0 ? true : false,
                filters: val?.filters || []
              }));
            }}
            getOptionLabel={(option) => option.name}
            getOptionSelected={(option, value) => option.kpi === value.kpi}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="KPI"
                variant="outlined"
                helperText={errors && !Boolean(formValues.kpi) && errors?.kpi}
                error={errors && !Boolean(formValues.kpi) && Boolean(errors?.kpi)}
              />
            )}
          />
        </Box>
        <Box mt={2}>
          <TextField
            required
            value={formValues.chartTitle}
            onChange={(e) => handleChange('chartTitle', e.target.value)}
            size="small"
            fullWidth
            variant="outlined"
            label={`Title`}
            helperText={errors && !Boolean(formValues.chartTitle) && errors?.chartTitle}
            error={errors && !Boolean(formValues.chartTitle) && Boolean(errors?.chartTitle)}
          />
        </Box>
        <Box mt={2}>
          <Autocomplete
            size="small"
            options={GRAPH_TYPES}
            disabled
            value={formValues.graphType}
            onChange={(_, val) => handleChange('graphType', val)}
            getOptionLabel={(option) => option}
            getOptionSelected={(option, value) => option === value}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Graph Type"
                variant="outlined"
                helperText={errors && !Boolean(formValues.graphType) && errors?.graphType}
                error={errors && !Boolean(formValues.graphType) && Boolean(errors?.graphType)}
              />
            )}
          />
        </Box>
        <Box mt={2}>
          <Autocomplete
            size="small"
            options={CHART_TYPES}
            disabled
            value={formValues.chartType}
            onChange={(_, val) => handleChange('chartType', val)}
            getOptionLabel={(option) => option}
            getOptionSelected={(option, value) => option === value}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Chart Type"
                variant="outlined"
                helperText={errors && !Boolean(formValues.chartType) && errors?.chartType}
                error={errors && !Boolean(formValues.chartType) && Boolean(errors?.chartType)}
              />
            )}
          />
        </Box>
        {formValues.chartType === 'Bar' && (
          <Box mt={2}>
            <Autocomplete
              size="small"
              options={['x', 'y']}
              value={formValues.axis}
              onChange={(_, val) => handleChange('axis', val)}
              getOptionLabel={(option) => option}
              getOptionSelected={(option, value) => option === value}
              renderInput={(params) => <TextField {...params} required label="Flow Axis" variant="outlined" />}
            />
          </Box>
        )}
        <Box mt={2}>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Custom'}
                  checked={formValues.hasFilters}
                  onChange={(e) => handleChange('hasFilters', e.target.checked)}
                />
              }
              label="Filters"
            />
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Table' || formValues.graphType === 'Custom'}
                  checked={formValues.hasTableView}
                  onChange={(e) => handleChange('hasTableView', e.target.checked)}
                />
              }
              label="Table View"
            />
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Map' || formValues.graphType === 'Custom'}
                  checked={formValues.hasExport}
                  onChange={(e) => handleChange('hasExport', e.target.checked)}
                />
              }
              label="Exports"
            />
            {formValues.chartType === 'Bar' && formValues.kpi.hasOwnProperty('stack') && (
              <FormControlLabel
                control={<Checkbox checked={formValues.stack} onChange={(e) => handleChange('stack', e.target.checked)} />}
                label="Stack"
              />
            )}
          </FormGroup>
        </Box>
        {formValues.hasFilters && (
          <Box mt={2}>
            <Autocomplete
              multiple
              size="small"
              disableCloseOnSelect
              options={formValues?.kpi?.filters || formValues?.filters || []}
              disabled={!formValues.kpi?.name}
              value={formValues.filters}
              onChange={(_, val) => handleChange('filters', val)}
              getOptionLabel={(option) => option.title}
              getOptionSelected={(option, value) => option.title === value.title}
              renderInput={(params) => (
                <TextField
                  {...params}
                  required
                  label="Filters"
                  variant="outlined"
                  helperText={errors && formValues.hasFilters && formValues.filters.length === 0 && errors?.filters}
                  error={errors && Boolean(errors?.filters) && formValues.hasFilters && formValues.filters.length === 0}
                />
              )}
            />
          </Box>
        )}
        <Box mt={2}>
          <FormControl component="fieldset">
            <FormLabel required component="legend">
              Column Size
            </FormLabel>
            <RadioGroup
              aria-label="column"
              name="column"
              value={formValues.column}
              className={classes.column}
              onChange={(e) => {
                let value: any = e.target.value;
                value = value.includes('custom') ? value : Number(value);
                handleChange('column', value);
              }}
            >
              <FormControlLabel value={3} control={<Radio />} label="Col 3" />
              <FormControlLabel value={6} control={<Radio />} label="Col 6" />
              <FormControlLabel value={12} control={<Radio />} label="Col 12" />
            </RadioGroup>
          </FormControl>
        </Box>
        <Box mt={2}>
          <Grid container>
            <Grid item>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.currency}
                      onChange={(e) => {
                        handleChange('currency', e.target.checked);
                        if (e.target.checked) {
                          handleChange('percentage', false);
                        }
                      }}
                    />
                  }
                  label="Currency"
                />
              </FormGroup>
            </Grid>
            <Grid item>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formValues.percentage}
                      onChange={(e) => {
                        handleChange('percentage', e.target.checked);
                        if (e.target.checked) {
                          handleChange('currency', false);
                        }
                      }}
                    />
                  }
                  label="Percentage"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </Box>
      </div>
      <Box mt={2}>
        <Button disableRipple fullWidth color="primary" onClick={addFormConfigs} variant="contained">
          {Boolean(selectedData) ? 'Apply Changes' : 'Add Chart'}
        </Button>
      </Box>
    </Box>
  );
};

export default Builder;

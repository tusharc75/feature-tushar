import React from 'react';
import { TextField, Box, Paper, Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, FormGroup, Checkbox, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Autocomplete } from '@material-ui/lab';
import { camelCase, startCase } from 'lodash';

import { CHART_TYPES, FILTERS_OPTIONS, KPIListType, GRAPH_TYPES, kpiList, IFormDataType, defaultFormConfigs, statuses } from './builderHelpers';
import axiosInstance from 'src/axios/axiosInstance';

const useClasses = makeStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%'
  },
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
      const formedData = { uniqueId: camelCase(formValues.chartTitle), ...formValues };
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
    <Box component={Paper} p={1.5} className={classes.container}>
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
                chartTitle: val?.name || ''
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

        {formValues.chartType === "Bar" && <Box mt={2}>
          <Autocomplete
            size="small"
            options={['x','y']}
            value={formValues.axis}
            onChange={(_, val) => handleChange('axis', val)}
            getOptionLabel={(option) => option}
            getOptionSelected={(option, value) => option === value}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Flow Axis"
                variant="outlined"
              />
            )}
          />
        </Box>
}
        {/* {isNaN(formValues.column) && (
          <Box mt={2}>
            <TextField required size="small" fullWidth variant="outlined" label={`Custom Column`} />
          </Box>
        )} */}

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
          </FormGroup>
        </Box>

        {formValues.hasFilters && (
          <Box mt={2}>
            <Autocomplete
              multiple
              size="small"
              disableCloseOnSelect
              options={FILTERS_OPTIONS}
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
              {/* <FormControlLabel value={'custom'} control={<Radio />} label="Custom" /> */}
            </RadioGroup>
          </FormControl>
        </Box>
      </div>

      <Box>
        <Button disableRipple fullWidth color="primary" onClick={addFormConfigs} variant="contained">
          {Boolean(selectedData) ? 'Apply Changes' : 'Add Chart'}
        </Button>
      </Box>
    </Box>
  );
};

export default Builder;

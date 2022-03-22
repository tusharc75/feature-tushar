import React from 'react';
import { TextField, Box, Paper, Radio, RadioGroup, FormControl, FormControlLabel, FormLabel, FormGroup, Checkbox, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';

import { CHART_TYPES, FILTERS_OPTIONS, GRAPH_TYPES, IFormDataType, defaultFormConfigs } from './builderHelpers';

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

  const classes = useClasses();

  React.useEffect(() => {
    if (selectedData) {
      setFormValues(selectedData);
    } else {
      setFormValues(defaultFormConfigs);
    }
  }, [selectedData]);

  const handleChange = (name: string, val: string | boolean | any[] | number) => {
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
        {/* {isNaN(formValues.column) && (
          <Box mt={2}>
            <TextField required size="small" fullWidth variant="outlined" label={`Custom Column`} />
          </Box>
        )} */}
        <Box mt={2}>
          <Autocomplete
            size="small"
            options={GRAPH_TYPES}
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
        {formValues.graphType === 'Chart' && (
          <Box mt={2}>
            <Autocomplete
              size="small"
              options={CHART_TYPES}
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
        )}

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
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Map'}
                  checked={formValues.hasFilters}
                  onChange={(e) => handleChange('hasFilters', e.target.checked)}
                />
              }
              label="Filters"
            />
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Table' || formValues.graphType === 'Map'}
                  checked={formValues.hasTableView}
                  onChange={(e) => handleChange('hasTableView', e.target.checked)}
                />
              }
              label="Table View"
            />
            <FormControlLabel
              control={
                <Checkbox
                  disabled={formValues.graphType === 'Map'}
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
              options={FILTERS_OPTIONS}
              value={formValues.filters}
              onChange={(_, val) => handleChange('filters', val)}
              getOptionLabel={(option) => option.title}
              getOptionSelected={(option, value) => option.key === value.key}
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
      </div>

      <Box>
        <Button disableRipple fullWidth color="primary" onClick={addFormConfigs} variant="contained">
          Apply Changes
        </Button>
      </Box>
    </Box>
  );
};

export default Builder;

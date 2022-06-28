import React from 'react';
import { Box, Checkbox, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select } from '@material-ui/core';
import moment from 'moment';

import FormTypes from 'src/components/Helpers/FormTypes';
import { KeyboardDatePicker } from '@material-ui/pickers';
import { dateFormat } from 'src/constants/helpers';

const Filters = ({
  selectedResources,
  handleSelectFilter,
  formValues,
  betweenDate,
  setBetweenDate,
  statusPeriod,
  statusTimeFrame,
  statusPeriodDate,
  setStatusPeriod,
  setStatusPeriodDate,
  setStatusTimeFrame
}) => {
  const [isStatusPeriod, setIsStatusPeriod] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleDuration = (timeFrameTemp, field, isStatus = false) => {
    switch (timeFrameTemp) {
      case '1-month':
        setStatusTimeFrame('1-month');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('1', 'month').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'month').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));

        break;
      case '3-months':
        setStatusTimeFrame('3-months');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('3', 'months').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('3', 'months').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      case '6-months':
        setStatusTimeFrame('6-months');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('6', 'months').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('6', 'months').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      case '1-year':
        setStatusTimeFrame('1-year');
        isStatus
          ? setStatusPeriodDate((prevState) => ({
              ...prevState,
              [`from_statusPeriod`]: new Date(moment().subtract('1', 'year').calendar()),
              [`to_statusPeriod`]: new Date()
            }))
          : setBetweenDate((prevState) => ({
              ...prevState,
              [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'year').calendar()),
              [`to_${field.fieldName}`]: new Date()
            }));
        break;

      default:
        break;
    }
  };

  return (
    <>
      {selectedResources.length > 0 &&
        selectedResources.map((field: any) => (
          <React.Fragment key={field._id}>
            {field.fieldName !== 'all' && field.type !== 'date' && (
              <Grid item xs={12} sm={6} md={6}>
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
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                  <Select
                    labelId={field.fieldName}
                    id={`time-${field.fieldName}`}
                    value={statusTimeFrame}
                    onChange={(e) => {
                      handleDuration(e.target.value, field);
                      //   const tempArray = [...selectedResources];
                      //   let tempIndex = tempArray.findIndex((d) => d?.fieldName === field?.fieldName);
                      //   tempArray[tempIndex].timeFrame = e.target.value;
                      //   setSelectedResources(tempArray);
                    }}
                  >
                    <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                    <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                    <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                    <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                    <MenuItem value={'custom'}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {field.type === 'date' && (
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  autoOk
                  disabled={field.timeFrame !== 'custom'}
                  fullWidth
                  size="small"
                  variant="inline"
                  inputVariant="outlined"
                  name={`from_${field.fieldName}`}
                  label={`From ${field.fieldLabel}`}
                  value={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : null}
                  onChange={(date: any) => {
                    setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                  }}
                  format={dateFormat}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
            )}
            {field.type === 'date' && (
              <Grid item xs={12} sm={6}>
                <KeyboardDatePicker
                  autoOk
                  fullWidth
                  disabled={field.timeFrame !== 'custom'}
                  size="small"
                  variant="inline"
                  inputVariant="outlined"
                  name={`to_${field.fieldName}`}
                  label={`To ${field.fieldLabel}`}
                  value={betweenDate && betweenDate[`to_${field.fieldName}`] ? betweenDate[`to_${field.fieldName}`] : null}
                  onChange={(date: any) => {
                    setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                  }}
                  format={dateFormat}
                  InputLabelProps={{
                    shrink: true
                  }}
                />
              </Grid>
            )}
          </React.Fragment>
        ))}
      {isStatusPeriod && (
        <Grid item xs={12}>
          <FormControlLabel
            control={<Checkbox checked={statusPeriod} onChange={(e) => setStatusPeriod((state: boolean) => !state)} name="statusPeriod" />}
            label="Status Period"
          />
        </Grid>
      )}

      {isStatusPeriod && statusPeriod && (
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="statusPeriod">Select Duration</InputLabel>
            <Select
              labelId="statusPeriod"
              id="time-duration"
              value={statusTimeFrame}
              onChange={(e) => {
                handleDuration(e.target.value, null, true);
                setStatusTimeFrame(e.target.value);
              }}
            >
              <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
              <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
              <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
              <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
              <MenuItem value={'custom'}>Custom</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      )}
      {isStatusPeriod && statusPeriod && (
        <Grid item xs={12} sm={6}>
          <KeyboardDatePicker
            autoOk
            fullWidth
            disabled={statusTimeFrame !== 'custom'}
            size="small"
            variant="inline"
            inputVariant="outlined"
            name={`from_statusPeriod`}
            label={`From Status Period`}
            value={statusPeriodDate && statusPeriodDate[`from_statusPeriod`] ? statusPeriodDate[`from_statusPeriod`] : null}
            onChange={(date: any) => {
              setStatusPeriodDate((prevState) => ({ ...prevState, [`from_statusPeriod`]: date }));
            }}
            format={dateFormat}
            InputLabelProps={{
              shrink: true
            }}
          />
        </Grid>
      )}
      {isStatusPeriod && statusPeriod && (
        <Grid item xs={12} sm={6}>
          <KeyboardDatePicker
            autoOk
            fullWidth
            size="small"
            variant="inline"
            disabled={statusTimeFrame !== 'custom'}
            inputVariant="outlined"
            name={`to_statusPeriod`}
            label={`To Status Period`}
            value={statusPeriodDate && statusPeriodDate[`to_statusPeriod`] ? statusPeriodDate[`to_statusPeriod`] : null}
            onChange={(date: any) => {
              setStatusPeriodDate((prevState) => ({ ...prevState, [`to_statusPeriod`]: date }));
            }}
            format={dateFormat}
            InputLabelProps={{
              shrink: true
            }}
          />
        </Grid>
      )}
    </>
  );
};

export default Filters;

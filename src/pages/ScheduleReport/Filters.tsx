import React, { Fragment } from 'react';
import { Checkbox, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import moment from 'moment';
import FormTypes from 'src/components/Helpers/FormTypes';
import { dateFormat } from 'src/constants/helpers';
import CustomDatePicker from 'src/components/CustomDatePicker';

const Filters = ({
  selectedResources,
  handleSelectFilter,
  formValues,
  resource,
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

  React.useEffect(() => {
    setBetweenDate((prevState) => {
      let keys = prevState ? Object.keys(prevState) : [];
      keys.forEach((key) => {
        if (key?.includes('to') || key?.includes('from')) {
          if (!selectedResources?.map((d) => d.fieldName)?.includes(key.split('_')[1])) {
            delete prevState[key];
          }
        }
      });
      return prevState;
    });
    setIsStatusPeriod(
      resource?.includes('Serialized Asset') &&
      Boolean(selectedResources.find((res) => res.fieldName === 'status')) &&
      formValues?.hasOwnProperty('status') &&
      formValues.status.length > 0
    );
  }, [selectedResources, formValues]);

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

  React.useEffect(() => {
    const allDateData = { ...betweenDate, ...statusPeriodDate };
    const dateKeys = Object.keys(allDateData);
    const dateProperties = dateKeys.map((key) => key.split('_')[1]);

    dateProperties.forEach((key) => {
      let err = { ...errors };

      const from = new Date(allDateData[`from_${key}`]).getTime();
      const to = new Date(allDateData[`to_${key}`]).getTime();

      if (from >= to || to <= from) {
        //err[key] = `From ${startCase(key)} should be less then To ${startCase(key)}`;
        err[key] = `Please select valid date range`;
      } else {
        if (errors[key]) {
          setErrors((prev) => {
            delete prev[key];
            return prev;
          });
        }
      }
      setErrors(err);
    });
  }, [betweenDate, statusPeriodDate]);

  return (
    <>
      {selectedResources.length > 0 &&
        selectedResources.map((field: any) => (
          <React.Fragment key={field._id}>
            {field.fieldName === 'all' ? null : ['dropDown', 'multiSelect']?.includes(field.type) ? (
              <Grid item xs={12} sm={6} md={6}>
                <FormTypes
                  values={formValues}
                  errors={{}}
                  touched={{}}
                  label={field.fieldLabel}
                  name={field.fieldName}
                  type={field.type === 'dropDown' ? 'multiSelect' : field.type}
                  options={field.option}
                  setFieldValue={(name, value) => {
                    handleSelectFilter(field.type === 'dropDown' ? 'multiSelect' : field.type, name, value);
                  }}
                  required={false}
                  fullWidth
                  size="small"
                />
              </Grid>
            ) : field.type === 'date' ? (
              <Fragment>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                    <Select
                      labelId={field.fieldName}
                      id={`time-${field.fieldName}`}
                      value={statusTimeFrame}
                      onChange={(e) => {
                        handleDuration(e.target.value, field);
                        setStatusTimeFrame(e.target.value);
                      }}
                      label="Select Duration"
                    >
                      <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                      <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                      <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                      <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                      <MenuItem value={'custom'}>Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomDatePicker
                    disabled={statusTimeFrame !== 'custom'}
                    fullWidth
                    size="small"
                    name={`from_${field.fieldName}`}
                    label={`From ${field.fieldLabel}`}
                    value={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : null}
                    onChange={(date: any) => {
                      setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomDatePicker
                    fullWidth
                    disabled={statusTimeFrame !== 'custom'}
                    size="small"
                    name={`to_${field.fieldName}`}
                    label={`To ${field.fieldLabel}`}
                    value={betweenDate && betweenDate[`to_${field.fieldName}`] ? betweenDate[`to_${field.fieldName}`] : null}
                    onChange={(date: any) => {
                      setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                    }}
                    minDate={betweenDate && betweenDate[`from_${field.fieldName}`] ? betweenDate[`from_${field.fieldName}`] : new Date()}
                  />
                </Grid>
              </Fragment>
            ) : (
              <Grid item xs={12} sm={6}>
                <FormTypes
                  values={formValues}
                  errors={{}}
                  touched={{}}
                  label={field.fieldLabel}
                  name={field.fieldName}
                  type={field.type}
                  options={field.option}
                  setFieldValue={(name, value) => {
                    handleSelectFilter(field.type, name, value);
                  }}
                  required={false}
                  fullWidth
                  size="small"
                />
              </Grid>
            )}
          </React.Fragment>
        ))}
      {isStatusPeriod && (
        <Fragment>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Checkbox checked={statusPeriod} onChange={(e) => setStatusPeriod((state: boolean) => !state)} name="statusPeriod" />}
              label="Status Period"
            />
          </Grid>
          {statusPeriod && (
            <Fragment>
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
                    label="Select Duration"
                  >
                    <MenuItem value={'1-year'}>Last 1 Year</MenuItem>
                    <MenuItem value={'6-months'}>Last 6 Months</MenuItem>
                    <MenuItem value={'3-months'}>Last 3 Months</MenuItem>
                    <MenuItem value={'1-month'}>Last 1 Month</MenuItem>
                    <MenuItem value={'custom'}>Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomDatePicker
                  fullWidth
                  disabled={statusTimeFrame !== 'custom'}
                  size="small"
                  name={`from_statusPeriod`}
                  label={`From Status Period`}
                  value={statusPeriodDate && statusPeriodDate[`from_statusPeriod`] ? statusPeriodDate[`from_statusPeriod`] : null}
                  onChange={(date: any) => {
                    setStatusPeriodDate((prevState) => ({ ...prevState, [`from_statusPeriod`]: date }));
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomDatePicker
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
                />
              </Grid>
            </Fragment>
          )}
        </Fragment>
      )}
    </>
  );
};

export default Filters;

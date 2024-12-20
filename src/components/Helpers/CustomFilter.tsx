import { useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Dialog, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import { BiFilterAlt } from 'react-icons/bi';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { isArray, isEmpty } from 'lodash';
import { Autocomplete } from '@material-ui/lab';
import CloseIcon from '@material-ui/icons/Close';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { cn, CustomDialogTransition, dateFormat } from 'src/constants/helpers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import { ThemeButton } from './Buttons';
import AsyncDropDown from 'src/components/Helpers/FormTypes/AsyncDropdown';
import { Close } from '@material-ui/icons';

const CustomFilter = ({ field, setFilterQuery, position = 'left' }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [formValues, setFormValues] = useState({});

  const [statusTimeFrame, setStatusTimeFrame] = useState<any>({});
  const [betweenDate, setBetweenDate] = useState(null);
  const [chipData, setChipData] = useState([]);

  const handleFilterOpen = () => {
    setIsFilterOpen(true);
  };

  const handleClose = () => {
    setIsFilterOpen(false);
  };

  const handleSelectFilter = (name, value) => {
    setFormValues((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleApplyFilter = () => {
    const deepFilter: any = [];
    const filterById: any = [];
    const chipData: any = [];

    field.forEach((col) => {
      const fieldName = col?.fieldName;
      if (['date'].includes(col.type)) {
        const from = `from_${fieldName}`;
        const to = `to_${fieldName}`;

        const fromDate = formValues[from] ? formValues[from] : null;
        const toDate = formValues[to] ? formValues[to] : null;

        if (fromDate || toDate) {
          deepFilter.push({
            field: fieldName,
            term: {
              from: fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null,
              to: toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
            }
          });
          const dateValue =
            fromDate && toDate
              ? `${fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null} - ${
                  toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
                }`
              : fromDate || toDate
                ? `${fromDate ? `${moment(new Date(fromDate)).format('MM/DD/YYYY')} (From Date)` : ''} ${
                    toDate ? `${moment(new Date(toDate)).format('MM/DD/YYYY')} (To Date)` : ''
                  }`
                : null;
          chipData.push({
            title: col?.fieldLabel,
            name: fieldName,
            value: dateValue
          });
        }
      } else if (['dropDown'].includes(col.type) && !isEmpty(formValues[fieldName])) {
        if (formValues[fieldName] && !isArray(formValues[fieldName])) {
          filterById.push({
            field: fieldName,
            term: formValues[fieldName]?.optionValue
          });
          chipData.push({
            title: col?.fieldLabel,
            name: fieldName,
            value: formValues[fieldName]?.optionLabel
          });
        } else {
          filterById.push({
            field: fieldName,
            term: formValues[fieldName]?.map((item) => item.optionValue)
          });
          chipData.push({
            title: col?.fieldLabel,
            name: fieldName,
            value: formValues[fieldName]?.map((item) => item?.optionLabel)?.join(', ')
          });
        }
      }
    });

    setFilterQuery({
      filterById,
      deepFilter
    });
    setChipData(chipData);
    handleClose();
  };

  const clearSingleFilter = (name) => {
    delete formValues[name];
    delete formValues[`from_${name}`];
    delete formValues[`to_${name}`];
    setChipData((prev) => prev.filter((item) => item.name !== name));
    setFilterQuery((prev) => {
      return {
        filterById: prev?.filterById?.filter((item) => item.field !== name),
        deepFilter: prev?.deepFilter?.filter((item) => item.field !== name)
      };
    });
  };

  const handleDuration = (timeFrameTemp, field) => {
    switch (timeFrameTemp) {
      case '1-month':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '1-month' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('1', 'month').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'month').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '3-months':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '3-months' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('3', 'months').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('3', 'months').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '6-months':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '6-months' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('6', 'months').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('6', 'months').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      case '1-year':
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: '1-year' });
        formValues[`from_${field.fieldName}`] = new Date(moment().subtract('1', 'year').calendar());
        formValues[`to_${field.fieldName}`] = new Date();
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: new Date(moment().subtract('1', 'year').calendar()),
          [`to_${field.fieldName}`]: new Date()
        }));
        break;
      default:
        setStatusTimeFrame({ ...statusTimeFrame, [field.fieldName]: 'custom' });
        formValues[`from_${field.fieldName}`] = null;
        formValues[`to_${field.fieldName}`] = null;
        setBetweenDate((prevState) => ({
          ...prevState,
          [`from_${field.fieldName}`]: null,
          [`to_${field.fieldName}`]: null
        }));
        break;
    }
  };

  return (
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Box className="flex items-center justify-between gap-2">
        {position === 'left' && (
          <div className="flex-grow">
            <DisplyaFilters chipData={chipData} handleFilterOpen={handleFilterOpen} clearSingleFilter={clearSingleFilter} />
          </div>
        )}
        <ThemeButton
          tooltip="Apply Filters"
          startIcon={<BiFilterAlt className="-ml-1 mr-1 mt-[1px]" />}
          iconForMobile={<BiFilterAlt />}
          onClick={() => {
            setIsFilterOpen(true);
          }}
          variant="outlined"
        >
          Filters
        </ThemeButton>
        {position !== 'left' && (
          <div className="flex-grow">
            <DisplyaFilters chipData={chipData} handleFilterOpen={handleFilterOpen} clearSingleFilter={clearSingleFilter} />
          </div>
        )}
      </Box>
      {isFilterOpen && (
        <Dialog
          maxWidth={'md'}
          TransitionComponent={CustomDialogTransition}
          open={true}
          fullWidth
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              handleClose();
            }
          }}
          aria-describedby="Filter Dialog"
        >
          <CustomDialogHeader title={`Filters`} onClose={handleClose} showRequiredLabel={false} />
          <CustomDialogContent>
            <Box pt={2} pb={2}>
              <Grid container spacing={2}>
                {field ? (
                  field?.map((field: any, i: number) => {
                    if (
                      !statusTimeFrame[field.fieldName] &&
                      field.type === 'date' &&
                      !formValues[`from_${field.fieldName}`] &&
                      formValues[`to_${field.fieldName}`]
                    ) {
                      handleDuration('custom', field);
                    }
                    return (
                      <>
                        {field?.type === 'date' ? (
                          <>
                            <Grid item xs={12} sm={6} md={6} key={`${i}${field?.fieldName}`}>
                              <FormControl fullWidth size="small" variant="outlined">
                                <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                                <Select
                                  labelId={field.fieldLabel}
                                  id={`time-${field.fieldName}`}
                                  defaultValue={'custom'}
                                  value={statusTimeFrame[field.fieldName] ?? 'custom'}
                                  onChange={(e) => {
                                    handleDuration(e.target.value, field);
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
                            <Grid item xs={12} sm={6} md={6} key={`${i}${field?.fieldName}`}>
                              <KeyboardDatePicker
                                autoOk
                                disabled={!(statusTimeFrame[field.fieldName] === 'custom' || !(field.fieldName in statusTimeFrame))}
                                fullWidth
                                size="small"
                                variant="inline"
                                inputVariant="outlined"
                                name={`from_${field.fieldName}`}
                                label={`From ${field.fieldLabel}`}
                                value={formValues[`from_${field.fieldName}`] ? formValues[`from_${field.fieldName}`] : null}
                                onChange={(date: any) => {
                                  setBetweenDate((prevState) => ({ ...prevState, [`from_${field.fieldName}`]: date }));
                                  handleSelectFilter(`from_${field.fieldName}`, date);
                                }}
                                format={dateFormat}
                                InputLabelProps={{
                                  shrink: true
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={6} md={6} key={`${i}${field?.fieldName}`}>
                              <KeyboardDatePicker
                                autoOk
                                disabled={!(statusTimeFrame[field.fieldName] === 'custom' || !(field.fieldName in statusTimeFrame))}
                                fullWidth
                                size="small"
                                variant="inline"
                                inputVariant="outlined"
                                name={`to_${field.fieldName}`}
                                label={`To ${field.fieldLabel}`}
                                value={formValues[`to_${field.fieldName}`] ? formValues[`to_${field.fieldName}`] : null}
                                onChange={(date: any) => {
                                  setBetweenDate((prevState) => ({ ...prevState, [`to_${field.fieldName}`]: date }));
                                  handleSelectFilter(`to_${field.fieldName}`, date);
                                }}
                                format={dateFormat}
                                InputLabelProps={{
                                  shrink: true
                                }}
                                minDate={
                                  betweenDate && betweenDate[`from_${field.fieldName}`]
                                    ? betweenDate[`from_${field.fieldName}`]
                                    : formValues[`from_${field.fieldName}`]
                                      ? formValues[`from_${field.fieldName}`]
                                      : new Date()
                                }
                              />
                            </Grid>
                          </>
                        ) : field?.type === 'dropDown' && field?.options ? (
                          <Grid item xs={12} sm={6} md={6} key={`${i}${field?.fieldName}`}>
                            <Autocomplete
                              disableCloseOnSelect
                              options={field?.options}
                              getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                              getOptionSelected={(option: any, val) => option.optionValue === val}
                              value={!isEmpty(formValues) && formValues[field?.fieldName]}
                              onChange={(e, val) => {
                                handleSelectFilter(field?.fieldName, val);
                              }}
                              fullWidth
                              renderInput={(params) => (
                                <TextField {...params} label={field?.fieldLabel} variant="outlined" size="small" name={field?.fieldName} />
                              )}
                            />
                          </Grid>
                        ) : (
                          <Grid item xs={12} sm={6} md={6} key={`${i}${field?.fieldName}`}>
                            <AsyncDropDown
                              resource={field?.resource}
                              multiple={true}
                              errors={false}
                              touched={false}
                              value={!isEmpty(formValues) && formValues[field?.fieldName] ? formValues[field?.fieldName] : []}
                              fieldLabel={field?.fieldLabel}
                              onChange={(e, val) => {
                                handleSelectFilter(field?.fieldName, val);
                              }}
                              fieldName={field?.fieldName}
                              required={false}
                            />
                          </Grid>
                        )}
                      </>
                    );
                  })
                ) : (
                  <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </Box>
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button onClick={handleClose} size="small" color="primary" variant="outlined">
              Cancel
            </Button>
            <Button
              disabled={isEmpty(formValues) ? true : Object.values(formValues).every((value) => value === null) ? true : false}
              onClick={handleApplyFilter}
              size="small"
              color="primary"
              variant="contained"
            >
              Apply
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </MuiPickersUtilsProvider>
  );
};

export default CustomFilter;

const buttonStyle: React.CSSProperties = {
  borderRadius: 50,
  position: 'absolute',
  right: 5,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 16,
  color: 'var(--primary)'
};

const DisplyaFilters = ({ chipData, handleFilterOpen, clearSingleFilter }) => {
  return (
    <div className="custom-filter">
      {chipData?.length > 0 && (
        <div className={'max-w-[200px flex min-h-[26px] min-w-0 flex-wrap gap-2'}>
          {chipData?.map((filter) => (
            <div
              key={filter?.title}
              className={`relative max-w-[200px] cursor-pointer rounded-[6px] bg-[--new-theme-secondary-color] p-[5px_7px] pr-[26px] [border:1px_solid_var(--new-theme-secondary-border-color)]`}
              title={filter?.value}
              onClick={handleFilterOpen}
            >
              <span className={`line-clamp-1 text-[12px] font-medium leading-[14px] text-[--primary]`}>
                {filter?.title}={filter?.value}
              </span>
              <IconButton
                size="small"
                style={buttonStyle}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearSingleFilter(filter.name);
                }}
              >
                <Close fontSize="inherit" />
              </IconButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, Chip, Dialog, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import { BiFilterAlt } from 'react-icons/bi';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { debounce, isEmpty } from 'lodash';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import CloseIcon from '@material-ui/icons/Close';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { dateFormat } from 'src/constants/helpers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';

const CustomFilter = ({ field, setFilterQuery }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [formValues, setFormValues] = useState({});

  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusTimeFrame, setStatusTimeFrame] = useState<any>({});
  const [betweenDate, setBetweenDate] = useState(null);

  const [chipData, setChipData] = useState([]);

  const fetchOptions = useCallback(
    debounce(async (resource: string, searchKey: string = '') => {
      try {
        const lookupResourceName = resource;
        let query = `sa-field/options?resource=${lookupResourceName}&limit=10&search=${searchKey}`;
        const response = await axiosInstance().get(query);
        const options = [...response.data.data];
        setOptions(options);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }, 1000),
    []
  );

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

    field.forEach(col => {
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
              ? `${fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null} - ${toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
              }`
              : fromDate || toDate
                ? `${fromDate ? `${moment(new Date(fromDate)).format('MM/DD/YYYY')} (From Date)` : ''} ${toDate ? `${moment(new Date(toDate)).format('MM/DD/YYYY')} (To Date)` : ''
                }`
                : null;
          chipData.push({
            title: col?.fieldLabel,
            name: fieldName,
            value: dateValue
          });
        }
      } else if (['dropDown'].includes(col.type)) {
        if (formValues[fieldName]) {
          filterById.push({
            field: fieldName,
            term: formValues[fieldName]?.optionValue
          });
          chipData.push({
            title: col?.fieldLabel,
            name: fieldName,
            value: formValues[fieldName]?.optionLabel
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
      <Box mb={1} display="flex" justifyContent="space-between">
        <Box minWidth="70%">
          <DisplyaFilters chipData={chipData} handleFilterOpen={handleFilterOpen} clearSingleFilter={clearSingleFilter} />
        </Box>
        <HtmlTooltip title="Apply Filters" placement="top" arrow>
          <Button
            startIcon={<BiFilterAlt />}
            size='small'
            onClick={() => {
              setIsFilterOpen(true);
            }}
            variant='outlined'
          >
            Filters
          </Button>
        </HtmlTooltip>
      </Box>
      {isFilterOpen && (
        <Dialog
          maxWidth={'md'}
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
                    if (!statusTimeFrame[field.fieldName] && field.type === 'date' && !formValues[`from_${field.fieldName}`] &&
                      formValues[`to_${field.fieldName}`]
                    ) {
                      handleDuration('custom', field);
                    }
                    return (
                      <>
                        {field?.type === 'date' ? (
                          <>
                            <Grid item xs={12} sm={6} md={6} key={i}>
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
                            <Grid item xs={12} sm={6} md={6} key={i}>
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
                            <Grid item xs={12} sm={6} md={6} key={i}>
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
                        ) :
                          field?.type === 'dropDown' && field?.options ?
                            <Grid item xs={12} sm={6} md={6} key={i}>
                              <Autocomplete
                                options={field?.options}
                                getOptionLabel={(option: any) => (option ? option.optionLabel : '')}
                                getOptionSelected={(option: any, val) => option.optionValue === val}
                                value={!isEmpty(formValues) && formValues[field?.fieldName]}
                                onChange={(e, val) => {
                                  handleSelectFilter(field?.fieldName, val);
                                }}
                                fullWidth
                                renderInput={(params) =>
                                  <TextField {...params}
                                    label={field?.fieldLabel}
                                    variant="outlined"
                                    size='small'
                                    name={field?.fieldName} />}
                              />
                            </Grid>
                            : <Grid item xs={12} sm={6} md={6} key={i}>
                              <Autocomplete
                                onOpen={() => {
                                  setOptions([]);
                                  setLoading(true);
                                  fetchOptions(field?.resource, '');
                                }}
                                onInputChange={(event, value) => fetchOptions(field?.resource, value)}
                                options={options}
                                fullWidth
                                loading={loading}
                                getOptionLabel={(option: any) => option.optionLabel ?? ''}
                                getOptionSelected={(option: any, value: any) => option?.optionValue === value?.optionValue}
                                value={!isEmpty(formValues) && formValues[field?.fieldName]}
                                onChange={(e, val) => {
                                  handleSelectFilter(field?.fieldName, val);
                                }}
                                size="small"
                                renderInput={(params) => <TextField {...params} label={field?.fieldLabel} variant="outlined" name={field?.fieldName} />}
                              />
                            </Grid>
                        }
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
              Apply Now
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
    </MuiPickersUtilsProvider>
  );
};

export default CustomFilter;

const DisplyaFilters = (props) => {
  const { chipData, handleFilterOpen, clearSingleFilter } = props;
  const [hiddenItems, setHiddenItems] = useState(0);

  const containerRef = useRef(null);
  const countRef = useRef(null);
  const COUNT_PADDING = 10;

  useEffect(() => {
    setHiddenItems(0);
    if (containerRef?.current) {
      hideElementAndShowNumber(containerRef.current);
    }
  }, [chipData]);

  const hideElementAndShowNumber = (container) => {
    const childItems = [...container?.children];

    childItems.forEach((item) => (item.style.display = 'inline-flex'));
    let lastVisibleItem = null;
    const hiddenItems = [];
    for (let i = 0; i < childItems.length; i++) {
      const item = childItems[i] as HTMLDivElement;
      const isOverlapping = item.getBoundingClientRect().right >= container.getBoundingClientRect().right - COUNT_PADDING;
      if (isOverlapping) {
        hiddenItems.push(item);
        if (!lastVisibleItem) {
          lastVisibleItem = childItems[i - 1];
        }
      }
    }
    hiddenItems.forEach((item) => (item.style.display = 'none'));

    const count = hiddenItems.length;
    setHiddenItems(count);

    const deltaX = lastVisibleItem?.offsetLeft + lastVisibleItem?.clientWidth;

    if (countRef.current) {
      countRef.current.style.cssText = `
          left: ${deltaX + COUNT_PADDING}px;
          display: ${count === 0 ? 'none' : 'block'};
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          `;
    }
  };

  return (
    <div className="custom-filter">
      {chipData?.length > 0 && (
        <div className="chip-container" style={{ paddingRight: `${55 + COUNT_PADDING}px` }}>
          <div className={'chip-group'} ref={containerRef}>
            {chipData?.map((filter) => (
              <Chip
                onClick={handleFilterOpen}
                className={'filter-chip'}
                deleteIcon={<CloseIcon />}
                label={`${filter?.title}=${filter?.value}`}
                onDelete={() => clearSingleFilter(filter.name)}
              />
            ))}
          </div>

          <div
            ref={countRef}
            style={{ cursor: 'pointer', position: 'absolute', top: '50%', transform: 'translateY(-50%)', border: '1px solid red' }}
            onClick={handleFilterOpen}
          >
            +{hiddenItems} more
          </div>
        </div>
      )}
    </div>
  );
};

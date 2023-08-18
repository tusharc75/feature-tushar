import { useCallback, useEffect, useState } from 'react';
import { CircularProgress, Box, Button, Chip, Dialog, FormControl, Grid, InputLabel, MenuItem, Select, TextField, Typography, Container } from '@material-ui/core';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import { debounce, isEmpty } from 'lodash';
import { Autocomplete } from '@material-ui/lab';
import axiosInstance from 'src/axios/axiosInstance';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { dateFormat } from 'src/constants/helpers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import VirtualizedList from '../../../components/VirtualizedList';
import DialogContent from '@material-ui/core/DialogContent';
import { useHistory } from 'react-router-dom';
import routes from './../../../components/Helpers/Routes';
import { List } from '@material-ui/icons';


const CustomFilter = ({ field, setFilterQuery, showGrid, setShowGrid, loadingData }) => {

    const history = useHistory();
    const [formValues, setFormValues] = useState({});
    const [selectedResources, setSelectedResources] = useState([])
    const [resourceOptions, setResourceOptions] = useState(null)

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusTimeFrame, setStatusTimeFrame] = useState<any>({});
    const [betweenDate, setBetweenDate] = useState(null);

    const [selectedData, setSelectedData] = useState(null)

    //selectedResources represents the main filter array
    //selectedData is an object with keys as the filter and value as the sub filter values

    useEffect(() => {
        if (!selectedData) return;
        setSelectedData((prevState: any) => {
            const dataKeys = Object.keys(prevState);
            const selectedKeys = Object.keys(selectedResources);

            if (selectedResources.length > 0 && dataKeys.length > 0) {
                dataKeys.forEach((key) => {
                    if (selectedKeys.includes(key) && prevState?.hasOwnProperty(key)) {
                        delete prevState[key];
                    }
                });
            }
            return prevState;
        });
    }, [selectedData, selectedResources]);

    const fetchOptions = useCallback(
        debounce(async (resource: string, searchKey: string = '') => {
            try {
                const lookupResourceName = resource;
                let query = `sa-field/options?resource=${lookupResourceName}&limit=10&search=${searchKey}`;
                const response = await axiosInstance().get(query);
                const options = [...response.data.data];
                setOptions(options);

                //set resource options
                const optionsData: any = {};
                [...field].filter((d: any) => (d.type === 'dropDown' || d.type === 'multiSelect' || d.type === 'date' || d.type === 'checkBox'))
                    .map((d: any) => {
                        if (d.type === 'dropDown' || d.type === 'multiSelect') {
                            optionsData[d.fieldName] = {
                                options: options,
                                type: d.type,
                                lookup: Boolean(d?.lookup)
                            };
                        }
                        if (d.type === 'date') {
                            d['timeFrame'] = 'custom';
                        }
                        return d;
                    });

                setResourceOptions(optionsData);

                setLoading(false);
            } catch (error) {
                console.error(error);
            }
        }, 1000),
        []
    );

    const handleClose = () => {
        history.push(routes.iotReport.path); 
    };

    const handleSelectFilter = (type, name, value) => {
        let fieldProps: any = {};

        if (type === 'dropDown' || type === 'multiSelect') {
            fieldProps.type = resourceOptions[name].type;
            fieldProps.lookup = resourceOptions[name].lookup;
        }
        else if (type === "checkBox") {
            fieldProps.type = 'checkBox';
            fieldProps.lookup = false;
        }
        else {
            fieldProps.type = 'date';
            fieldProps.lookup = false;
        }

        const newData: any = {
            type: fieldProps.type,
            lookup: fieldProps.lookup
        };

        if (Array.isArray(value)) {
            const tempVal = value.map(item => item.optionValue);
            newData.value = resourceOptions[name].options?.filter((d) => tempVal?.includes(d.optionValue));
            setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
        } else {
            newData.value = value;
            setSelectedData((prevState) => ({ ...prevState, [name]: newData }));
        }
        setFormValues((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleApplyFilter = () => {
        let deepFilter: any = [];
        let filterById: any = [];
        if (selectedResources.length > 0) {
            if (selectedData) {
              const keys = selectedData ? Object.keys(selectedData) : [];
              const idFilter = keys.filter((key) => selectedData[key] && selectedData[key].lookup);
              const forDeepFilter = keys.filter((key) => selectedData[key] && !selectedData[key].lookup);
      
              filterById = idFilter.map((key) => {
                const options = selectedData[key]?.value;
                return {
                  field: key,
                  term: {
                    $in: options.map((d: any) => d.optionValue)
                  }
                };
              });
      
              forDeepFilter.forEach((key) => {
                if (selectedData[key].type === 'checkBox') {
                  deepFilter.push({
                    field: key,
                    term: selectedData[key].value ? 'Yes' : 'No'
                  });
                } else if(key === 'from_date'){
                        const fromDate = selectedData['from_date'] ? selectedData['fromDate'] : null;
                        if (fromDate) {
                        deepFilter.push({
                            field: 'date',
                            term: {
                                from: fromDate ? moment(new Date(fromDate)).format('MM/DD/YYYY') : null,
                            }
                        });
                        }
                    
                    }
                    else if(key === 'to_date'){
                        const toDate = selectedData['to_date'] ? selectedData['to_date'] : null;
                        if (toDate) {
                        deepFilter.push({
                            field: 'date',
                            term: {
                                to: toDate ? moment(new Date(toDate)).format('MM/DD/YYYY') : null
                            }
                        });
                        }
                    }
                    else{
                      deepFilter.push({
                        field: key,
                        term: selectedData[key].value?.map((d: any) => d.optionValue)
                      });

                }
              });
            }
      
            if (betweenDate) {
              const fields = Object.keys(betweenDate);
              fields.forEach((field) => {
                if (betweenDate[field]) {
                  deepFilter.push({
                    field,
                    term: moment(betweenDate[field]).format('MM/DD/YYYY')
                  });
                }
              });
            }
          }

       
        setShowGrid(true);
        setFilterQuery({
            filterById,
            deepFilter
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
        {!showGrid && (
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
                <DialogContent>
                    <div className="p-4 pt-5 min-h-[200px]">
                        <Container maxWidth="sm">
                            <Box textAlign="center" mb={2}>

                                <Autocomplete
                                    loadingText="Please wait..."
                                    options={field}
                                    limitTags={4}
                                    disableListWrap
                                    ListboxComponent={VirtualizedList as React.ComponentType<React.HTMLAttributes<HTMLElement>>}
                                    disableCloseOnSelect
                                    multiple
                                    value={selectedResources ?? []}
                                    onChange={(_, val, reason) => {
                                        if (val.filter((f) => f.fieldName === 'all').length > 0) {
                                            setSelectedResources(field);
                                        } else {
                                            setSelectedResources(val);
                                        }
                                        if (reason === 'remove-option' && selectedData) {
                                            const selectedKeys = val.map((f) => f?.fieldName);
                                            setSelectedData((prev) => {
                                                const dataKeys = Object?.keys(prev);
                                                if (dataKeys && dataKeys.length) {
                                                    dataKeys.forEach((key) => {
                                                        if (!selectedKeys?.includes(key)) {
                                                            delete prev[key];
                                                        }
                                                    });
                                                }
                                                return prev;
                                            });

                                            setFormValues((prev) => {
                                                const dataKeys = Object?.keys(prev);
                                                if (dataKeys && dataKeys.length) {
                                                    dataKeys.forEach((key) => {
                                                        if (!selectedKeys?.includes(key)) {
                                                            delete prev[key];
                                                        }
                                                    });
                                                }
                                                return prev;
                                            });
                                        }

                                        if (reason === 'remove-option' && betweenDate) {
                                            const selectedKeys = val.map((f) => f?.fieldName);
                                            setBetweenDate((prevState) => {
                                                let keys = prevState ? Object.keys(prevState) : [];
                                                keys.forEach((key) => {
                                                    if (key?.includes('to') || key?.includes('from')) {
                                                        if (!selectedKeys?.includes(key.split('_')[1])) {
                                                            delete prevState[key];
                                                        }
                                                    }
                                                });
                                                return prevState;
                                            });
                                        }
                                    }}
                                    fullWidth
                                    getOptionSelected={(option, val) => option.fieldName === val.fieldName}
                                    getOptionLabel={(option) => option.fieldLabel}
                                    renderInput={(params) => <TextField {...params} variant="outlined" label="Select Filter" size="small" />}
                                />
                                <Box py={2}>
                                <Grid container spacing={2}>
                                    {selectedResources.length > 0 ? (
                                        selectedResources?.map((field: any, i: number) => {
                                            if (!statusTimeFrame[field.fieldName] && field.type === 'date' && !formValues[`from_${field.fieldName}`] &&
                                                formValues[`to_${field.fieldName}`]
                                            ) {
                                                handleDuration('custom', field);
                                            }
                                            return (
                                                <>
                                                    {field?.type === 'date' ? (
                                                        <>
                                                            <Grid item xs={12} sm={6} md={6}>
                                                                <FormControl fullWidth size="small" variant="outlined">
                                                                    <InputLabel id={field.fieldName}>Select Duration</InputLabel>
                                                                    <Select
                                                                        labelId={field.fieldLabel}
                                                                        id={`time-${field.fieldName}`}
                                                                        defaultValue={'custom'}
                                                                        value={statusTimeFrame[field.fieldName] ?? 'custom'}
                                                                        onChange={(e) => {
                                                                            handleDuration(e.target.value, field);
                                                                            const tempArray = [...selectedResources];
                                                                            let tempIndex = tempArray.findIndex((d) => d?.fieldName === field?.fieldName);
                                                                            tempArray[tempIndex].timeFrame = e.target.value;
                                                                            setSelectedResources(tempArray);
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
                                                            <Grid item xs={12} sm={6} md={6}>
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
                                                                        handleSelectFilter(field?.type, `from_${field.fieldName}`, date);
                                                                    }}
                                                                    format={dateFormat}
                                                                    InputLabelProps={{
                                                                        shrink: true
                                                                    }}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6} md={6}>
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
                                                                        handleSelectFilter(field?.type, `to_${field.fieldName}`, date);
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
                                                    )
                                                        : field.fieldName !== 'all' && field.type !== 'date' && (
                                                            <Grid item xs={12} sm={6} md={6} key={i}>
                                                                <Autocomplete
                                                                    disableCloseOnSelect
                                                                    multiple
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
                                                                    value={!isEmpty(formValues) && formValues[field?.fieldName] ? formValues[field?.fieldName] : []}
                                                                    onChange={(e, val) => {
                                                                        handleSelectFilter(field?.type, field?.fieldName, val);
                                                                    }}
                                                                    size="small"
                                                                    renderInput={(params) => <TextField {...params} label={field?.fieldLabel} variant="outlined" name={field?.fieldName} />}
                                                                />
                                                            </Grid>
                                                        )
                                                    }
                                                </>
                                            );
                                        })
                                    ) : (
                                        <Box textAlign="center" width="100%">
                                            <Typography>No filters selected</Typography>
                                        </Box>
                                    )}
                                </Grid>
                                </Box>
                                <Box mt={2}>
                                <Button
                                    onClick={handleApplyFilter}
                                    startIcon={loadingData ? <CircularProgress color="inherit" size={18} /> : <List />}
                                    color="primary"
                                    variant="contained"
                                    size="small"
                                    disableElevation
                                    fullWidth
                                    disabled={loadingData}
                                >
                                    Show
                                </Button>
                                </Box>
                            </Box>
                        </Container>
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </MuiPickersUtilsProvider>
);
};

export default CustomFilter;



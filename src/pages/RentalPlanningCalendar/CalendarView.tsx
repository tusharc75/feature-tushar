import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { Calendar, View, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'
import moment from 'moment';
import { Grid, makeStyles, Checkbox, TextField } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';

const DragAndDropCalendar = withDragAndDrop(Calendar as any)
const localizer = momentLocalizer(moment);

const formats = {
    weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const useStyles = makeStyles((theme) => ({
    topbar: {
        backgroundColor: '#fff'
    },
    whiteBg: {
        backgroundColor: '#fff'
    },
    indicators: {
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        lineHeight: '17px'
    }
}));

export default function CalendarView() {

    const classes = useStyles();
    const [events, setEvents] = useState([])
    const [view, setView] = useState<View>('month');
    const [staticEvents, setStaticEvents] = useState([])
    const [filterToKeep, setFilterToKeep] = useState([]);

    const [warehouse, setWarehouse] = useState([])
    const [product, setProduct] = useState([])
    const [asset, setAsset] = useState([])

    const [selectedWarehouse, setSelectedWarehouse] = useState(null)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedAsset, setSelectedAsset] = useState(null)

    const [dateRange, setDateRange] = useState({
        estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
        estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
    })

    const defaultDate = useMemo(() => moment().toDate(), [])

    const RENTAL_PLANNING_CALENDAR_FILTER = {
        warehouse: 'Plant',
        product: 'Product',
        asset: 'Asset'
    }

    useEffect(() => {
        axiosInstance()
            .get('/sa-formbuilder/lookup?lookupResource=Warehouse,Product,Serialized Asset')
            .then(({ data: { data } }) => {
                setProduct(data['Product'])
                setAsset(data['Serialized Asset'])
                setWarehouse(data['Warehouse'])
            })
            .catch((err) => { });
    }, [])

    const getQueryString = () => {
        const api = '/rental-planning-calendar';
        const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`
        let query = `${api}?date=${date}`

        if (selectedWarehouse) {
            query = `${query}&warehouse=${selectedWarehouse?.optionValue}`
        }
        if (selectedProduct) {
            query = `${query}&product=${selectedProduct?.optionValue}`
        }
        if (selectedAsset) {
            query = `${query}&asset=${selectedAsset?.optionValue}`
        }

        return query;
    }

    const fetchData = () => {
        const queryString = getQueryString();
        axiosInstance()
            .get(queryString)
            .then(({ data: { data } }) => {
                const rentalData = data?.rental.map((d: any) => {
                    return (
                        {
                            id: d._id,
                            title: d.rentalJobName,
                            start: new Date(d.estimateStartDate),
                            end: new Date(d.estimateEndDate),
                            allDay: true,
                            type: 'rental'
                        }
                    )
                });
                const scheduleData = data?.schedule.map((d: any) => {
                    return (
                        {
                            id: d._id,
                            title: d.scheduleNumber,
                            start: new Date(d.startDate),
                            end: new Date(d.endDate),
                            allDay: true,
                            type: 'schedule'
                        }
                    )
                });
                setEvents([...rentalData, ...scheduleData]);
                setStaticEvents([...rentalData, ...scheduleData])
            })
            .catch((err) => { });
    }

    const updateData = (event, start, end) => {
        let route = ''
        if (event.type === 'rental') {
            route = 'change-rental-date'
        } else if (event.type === 'schedule') {
            route = 'change-schedule-date'
        }
        axiosInstance()
            .put(`/rental-planning-calendar/${route}`, {
                _id: event.id,
                startDate: start.toISOString(),
                endDate: end.toISOString()
            })
            .then((data) => {
                fetchData()
            })
            .catch((err) => { });
    }

    useEffect(() => {
        fetchData()
    }, [selectedWarehouse, selectedProduct, selectedAsset, dateRange]);

    const moveEvent = ({ event, start, end }) => {
        const filterEvents = staticEvents.filter(ev => ev.id !== event.id)
        const existing = staticEvents.find((ev) => ev.id === event.id) ?? {}
        setEvents([...filterEvents, { ...existing, start, end }])
        updateData(event, start, end)
    }

    const resizeEvent = ({ event, start, end }) => {
        const filterEvents = staticEvents.filter(ev => ev.id !== event.id)
        const existing = staticEvents.find((ev) => ev.id === event.id) ?? {}
        setEvents([...filterEvents, { ...existing, start, end }])
        updateData(event, start, end)
    }

    const onView = useCallback(
        (view) => {
            setView(view);
        },
        [setView]
    );

    return (
        <>
            <div className={`bgLight ${classes.whiteBg}`}>
                <Grid container spacing={2} className={`greyBox ${classes.topbar}`}>
                    <Grid item xs={12} sm={6} md={4} lg={4}>
                        <Autocomplete
                            fullWidth
                            multiple
                            options={Object.keys(RENTAL_PLANNING_CALENDAR_FILTER)?.map((key) => key) || []}
                            disableCloseOnSelect
                            getOptionLabel={(option) => RENTAL_PLANNING_CALENDAR_FILTER[option]}
                            renderOption={(option: any) => (
                                <React.Fragment>
                                    <Checkbox checked={filterToKeep?.includes(option)} />
                                    {RENTAL_PLANNING_CALENDAR_FILTER[option]}
                                </React.Fragment>
                            )}
                            size="small"
                            renderInput={(params) => <TextField {...params} label="Filters" placeholder="filter" variant="outlined" />}
                            value={filterToKeep}
                            onChange={(event: any, newValue: any) => {
                                setFilterToKeep(newValue);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={8} lg={8}>
                        <Grid container spacing={1}>
                            {filterToKeep?.includes('warehouse') &&
                                < Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={warehouse}
                                        fullWidth
                                        getOptionLabel={(option: any) => option.optionLabel}
                                        getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                        value={selectedWarehouse}
                                        onChange={(event, newValue) => {
                                            setSelectedWarehouse(newValue);
                                        }}
                                        size="small"
                                        renderInput={(params) => <TextField {...params} label={`Select Plant`} variant="outlined" />}
                                    />
                                </Grid>
                            }
                            {filterToKeep?.includes('product') &&
                                < Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={product}
                                        fullWidth
                                        getOptionLabel={(option: any) => option.optionLabel}
                                        getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                        value={selectedProduct}
                                        onChange={(event, newValue) => {
                                            setSelectedProduct(newValue);
                                        }}
                                        size="small"
                                        renderInput={(params) => <TextField {...params} label={`Select Product`} variant="outlined" />}
                                    />
                                </Grid>
                            }
                            {filterToKeep?.includes('asset') &&
                                < Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={asset}
                                        fullWidth
                                        getOptionLabel={(option: any) => option.optionLabel}
                                        getOptionSelected={(option: any, value: any) => option.optionValue === value.optionValue}
                                        value={selectedAsset}
                                        onChange={(event, newValue) => {
                                            setSelectedAsset(newValue);
                                        }}
                                        size="small"
                                        renderInput={(params) => <TextField {...params} label={`Select Asset`} variant="outlined" />}
                                    />
                                </Grid>
                            }
                        </Grid>
                    </Grid>
                </Grid>
                <DragAndDropCalendar
                    defaultDate={defaultDate}
                    defaultView={'day'}
                    events={events}
                    formats={formats}
                    localizer={localizer}
                    onEventDrop={moveEvent}
                    onEventResize={resizeEvent}
                    popup={true}
                    resizable
                    views={{ month: true, week: true, day: true }}
                    onView={onView}
                    view={view}
                    eventPropGetter={(obj: any) => {
                        const newStyles = {
                            backgroundColor: obj.type === 'rental' ? 'rgba(255, 232, 204, 1)' : 'rgba(234, 239, 254, 1)',
                            color: obj?.type === 'rental' ? 'rgba(236, 85, 0, 1)' : 'rgba(4, 50, 161, 1)',
                            borderRadius: '4px',
                            border: 'none',
                            padding: '8px 16px'
                        };

                        return {
                            style: newStyles
                        };
                    }}
                    onNavigate={(date) => {
                        if (view === 'month') {
                            setDateRange({
                                estimateStartDate: moment(date).startOf('month').format('MM/DD/YYYY'),
                                estimateEndDate: moment(date).endOf('month').format('MM/DD/YYYY')
                            });
                        }
                    }}
                />
            </div>
        </>
    )
}
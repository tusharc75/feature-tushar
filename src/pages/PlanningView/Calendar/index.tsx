import React, { useEffect, useCallback, useMemo, useState, useContext } from 'react'
import { useHistory } from 'react-router-dom';
import { Calendar, View, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'
import './calendarView.scss'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import moment from 'moment';
import { Grid, Checkbox, TextField, Box } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';
import { Autocomplete } from '@material-ui/lab';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { sidebarResource } from 'src/constants/helpers';

const DragAndDropCalendar = withDragAndDrop(Calendar as any)
const localizer = momentLocalizer(moment);
const formats = {
    weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const newStyles = {
    backgroundColor: 'rgba(234, 239, 254, 1)',
    color: 'rgba(4, 50, 161, 1)',
    borderRadius: '4px',
    border: 'none',
    padding: '8px 16px'
};

function CalendarView({ resourceList }) {

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, selectedEntity, permissions }
    }: any = useData();

    const history = useHistory();
    const [events, setEvents] = useState([])
    const [view, setView] = useState<View>('month');
    const [filterToKeep, setFilterToKeep] = useState([]);
    const [warehouse, setWarehouse] = useState([])
    const [product, setProduct] = useState([])
    const [asset, setAsset] = useState([])
    const [selectedWarehouse, setSelectedWarehouse] = useState([])
    const [selectedProduct, setSelectedProduct] = useState([])
    const [selectedAsset, setSelectedAsset] = useState([])

    const [selectedResource, setSelectedResource] = useState(null);

    const [renderCount, setRenderCount] = useState(0)
    const defaultDate = useMemo(() => moment().toDate(), [])

    const [staticEvents, setStaticEvents] = useState([])


    const [dateRange, setDateRange] = useState({
        estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
        estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
    })

    const [month, setMonth] = useState({
        startDate: moment().startOf('month').format('MM/DD/YYYY'),
        endDate: moment().endOf('month').format('MM/DD/YYYY')
    })
    const [week, setWeek] = useState({
        startDate: moment().startOf('week').format('MM/DD/YYYY'),
        endDate: moment().endOf('week').format('MM/DD/YYYY')
    })
    const [day, setDay] = useState({
        startDate: moment().startOf('day').format('MM/DD/YYYY'),
        endDate: moment().endOf('day').format('MM/DD/YYYY')
    })

    const [agenda, setAgenda] = useState({
        startDate: moment().startOf('day').format('MM/DD/YYYY'),
        endDate: moment().add(1, 'months').format('MM/DD/YYYY')
    })


    const FILTERS = {
        warehouse: 'Plant',
        product: 'Product',
        asset: 'Asset'
    }

    useEffect(() => {
        if (view === 'month') {
            setMonth({
                startDate: dateRange.estimateStartDate,
                endDate: dateRange.estimateEndDate,
            })
        } else if (view === 'week') {
            setWeek({
                startDate: dateRange.estimateStartDate,
                endDate: dateRange.estimateEndDate,
            })
        } else if (view === 'day') {
            setDay({
                startDate: dateRange.estimateStartDate,
                endDate: dateRange.estimateEndDate,
            })
        } else if (view === 'agenda') {
            setAgenda({
                startDate: dateRange.estimateStartDate,
                endDate: dateRange.estimateEndDate,
            })
        }
    }, [dateRange])

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

    const queryData = (data) => {
        let queryData = null;
        data.forEach((item, i) => {
            if (i === 0) {
                queryData = item.optionValue;
            } else {
                queryData = queryData + ',' + item.optionValue
            }
        });
        return queryData;
    }

    useEffect(() => {
        if (selectedResource) {
            fetchData()
        }
        else {
            setEvents([])
        }
    }, [selectedResource, selectedWarehouse, selectedProduct, selectedAsset, dateRange]);

    const getQueryString = () => {
        const api = '/planning-view';
        const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`
        let query = `${api}?date=${date}`

        if (selectedResource) {
            query = `${query}&resource=${selectedResource.resource}`
        }
        if (selectedWarehouse.length > 0) {
            const warehouse = queryData(selectedWarehouse);
            query = `${query}&warehouse=${warehouse}`
        }
        if (selectedProduct.length > 0) {
            const product = queryData(selectedProduct)
            query = `${query}&product=${product}`
        }
        if (selectedAsset.length > 0) {
            const asset = queryData(selectedAsset)
            query = `${query}&asset=${asset}`
        }

        return query;
    }

    const fetchData = () => {
        const queryString = getQueryString();
        axiosInstance()
            .get(queryString)
            .then(({ data: { data } }) => {
                const rows = data?.map((d: any) => {
                    return (
                        {
                            id: d._id,
                            title: d[selectedResource.fieldName],
                            start: new Date(d[selectedResource.start]),
                            end: new Date(d[selectedResource.end]),
                            allDay: true,
                            type: selectedResource.resource
                        }
                    )
                })
                setEvents(rows);
                setStaticEvents(rows)
            })
            .catch((err) => {

            });
    }

    useEffect(() => {
        if (selectedWarehouse.length > 0 || selectedProduct.length > 0 || selectedAsset.length > 0) {
            if (!filterToKeep.includes('warehouse')) {
                setSelectedWarehouse([])
            }
            if (!filterToKeep.includes('product')) {
                setSelectedProduct([])
            }
            if (!filterToKeep.includes('asset')) {
                setSelectedAsset([])
            }
        }
    }, [filterToKeep])

    const onView = useCallback(
        (view) => {
            setView(view);
        },
        [setView]
    );

    const clickableEventInListView = () => {

        const header = document.getElementsByClassName('rbc-header')[2];
        if (header) {
            header.innerHTML = selectedResource.title
        }

        const element: any = document.getElementsByClassName('rbc-agenda-event-cell');
        for (let i = 0; i < element?.length; i++) {
            element[i].onclick = () => {
                const event = events.filter(event => event.title === element[i].innerText)[0]
                const path = selectedResource.path
                history.push(`${path}/${event.id}`);
            }
        }
    }

    useEffect(() => {
        if (view === 'agenda') {
            clickableEventInListView()
        }
    }, [events])

    useEffect(() => {
        if (renderCount !== 0) {
            if (view === 'month') {
                setDateRange({
                    estimateStartDate: month.startDate,
                    estimateEndDate: month.endDate
                })
            } else if (view === 'week') {
                setDateRange({
                    estimateStartDate: week.startDate,
                    estimateEndDate: week.endDate
                })
            } else if (view === 'day') {
                setDateRange({
                    estimateStartDate: day.startDate,
                    estimateEndDate: day.endDate
                })
            } else if (view === 'agenda') {
                setDateRange({
                    estimateStartDate: agenda.startDate,
                    estimateEndDate: agenda.endDate
                })
            }
        } else {
            setRenderCount(renderCount + 1)
        }
    }, [view])

    const updateData = (event, start, end) => {
        axiosInstance()
            .put(`/planning-view/change-date`, {
                _id: event.id,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                resource: event.type
            })
            .then(({ data }) => {
                toastConfig.setToastConfig({
                    open: true,
                    type: 'success',
                    message: data.message
                });
                fetchData()
            })
            .catch((error) => {
                toastConfig.setToastConfig(error);
                fetchData()
            });
    }

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

    const onNavigate = (date) => {
        if (view === 'month') {
            setDateRange({
                estimateStartDate: moment(date).startOf('month').format('MM/DD/YYYY'),
                estimateEndDate: moment(date).endOf('month').format('MM/DD/YYYY')
            });
        } else if (view === 'week') {
            setDateRange({
                estimateStartDate: moment(date).startOf('week').format('MM/DD/YYYY'),
                estimateEndDate: moment(date).endOf('week').format('MM/DD/YYYY')
            });
        } else if (view === 'day') {
            setDateRange({
                estimateStartDate: moment(date).format('MM/DD/YYYY'),
                estimateEndDate: moment(date).format('MM/DD/YYYY')
            });
        } else if (view === 'agenda') {
            setDateRange({
                estimateStartDate: moment(date).format('MM/DD/YYYY'),
                estimateEndDate: moment(date).add(1, 'months').format('MM/DD/YYYY')
            });
        }
    }

    return (
        <>
            <div>
                <Box display="flex" flexDirection='column'>
                    <Box display="flex" flexDirection="row">
                        <Box ml={1}>
                            <Autocomplete
                                options={resourceList}
                                getOptionLabel={(option) => option && option?.title || ''}
                                style={{ width: "350px" }}
                                value={selectedResource}
                                onChange={(event, newValue) => {
                                    setSelectedResource(newValue)
                                }}
                                size="small"
                                renderInput={(params) =>
                                    <TextField
                                        {...params}
                                        label="Select Resource"
                                        size="small"
                                        variant="outlined"
                                    />
                                }
                            />
                        </Box>
                        <Box ml={1}>
                            <Autocomplete
                                style={{ width: "350px" }}
                                multiple
                                options={Object.keys(FILTERS)?.map((key) => key) || []}
                                disableCloseOnSelect
                                getOptionLabel={(option) => FILTERS[option]}
                                renderOption={(option: any) => (
                                    <React.Fragment>
                                        <Checkbox checked={filterToKeep?.includes(option)} />
                                        {FILTERS[option]}
                                    </React.Fragment>
                                )}
                                size="small"
                                renderInput={(params) => <TextField {...params} label="Filters" variant="outlined" />}
                                value={filterToKeep}
                                onChange={(event: any, newValue: any) => {
                                    setFilterToKeep(newValue);
                                }}
                            />
                        </Box>
                    </Box>
                    <Box display="flex" flexDirection="row" ml={1} mt={2}>
                        <Grid container spacing={2}>
                            {filterToKeep?.includes('warehouse') &&
                                <Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={warehouse}
                                        multiple
                                        disableCloseOnSelect
                                        getOptionLabel={(option: any) => option.optionLabel}
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
                                <Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={product}
                                        multiple
                                        disableCloseOnSelect
                                        getOptionLabel={(option: any) => option.optionLabel}
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
                                <Grid item xs={12} sm={6} md={4} lg={4}>
                                    <Autocomplete
                                        options={asset}
                                        multiple
                                        disableCloseOnSelect
                                        getOptionLabel={(option: any) => option.optionLabel}
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
                    </Box>
                </Box>
                {
                    (selectedResource?.resource === sidebarResource.rentalManagement || selectedResource?.resource === sidebarResource.planning)
                        ?
                        <DragAndDropCalendar
                            defaultDate={defaultDate}
                            defaultView={'day'}
                            events={events}
                            formats={formats}
                            localizer={localizer}
                            onEventDrop={moveEvent}
                            onEventResize={resizeEvent}
                            popup={true}
                            messages={{
                                agenda: 'List',
                            }}
                            resizable
                            views={{ month: true, week: true, day: true, agenda: true }}
                            onView={onView}
                            view={view}
                            eventPropGetter={(obj: any) => {
                                return {
                                    style: newStyles
                                };
                            }}
                            onNavigate={(date) => {
                                onNavigate(date)
                            }}
                            onSelectEvent={(event: any) => {
                                history.push(`${selectedResource.path}/${event.id}`);
                            }}
                        />
                        :
                        <Calendar
                            defaultDate={defaultDate}
                            defaultView={'day'}
                            events={events}
                            formats={formats}
                            localizer={localizer}
                            popup={true}
                            messages={{
                                agenda: 'List',
                            }}
                            views={{ month: true, week: true, day: true, agenda: true }}
                            onView={onView}
                            view={view}
                            eventPropGetter={(obj: any) => {
                                return {
                                    style: newStyles
                                };
                            }}
                            onNavigate={(date) => {
                                onNavigate(date)
                            }}
                            onSelectEvent={(event: any) => {
                                history.push(`${selectedResource.path}/${event.id}`);
                            }}
                        />
                }


            </div >
        </>
    )
}

export default CalendarView;
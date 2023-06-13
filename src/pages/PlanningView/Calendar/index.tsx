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
import { RESOURCE_LABEL, sidebarResource } from 'src/constants/helpers';

const DragAndDropCalendar = withDragAndDrop(Calendar as any)
const localizer = momentLocalizer(moment);
const formats = {
    weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const FILTERS = [
    {
        label: 'Plant',
        value: 'Warehouse',
        key: 'warehouse'
    },
    {
        label: 'Product',
        value: 'Product',
        key: 'product'
    },
    {
        label: 'Asset',
        value: 'Serialized Asset',
        key: 'asset'
    },
    {
        label: 'Service',
        value: 'Service Master',
        key: 'service'
    },
    {
        label: 'Customer Account',
        value: 'Customer Account',
        key: 'customerAccount'
    },
    {
        label: 'Competencies',
        value: 'Competencies',
        key: 'competencies'
    }
]

function CalendarView({ resourceList, commonSelectedResource, setCommonSelectedResource }) {

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, selectedEntity, permissions }
    }: any = useData();

    const history = useHistory();
    const [events, setEvents] = useState([])
    const [view, setView] = useState<View>('month');
    const [filterToKeep, setFilterToKeep] = useState([]);
    const [lookupResource, setLookUpResource] = useState(null)
    const [selectedLookUpResourceData, setSelectedLookUpResourceData] = useState(null)
    const [filterOptions, setFilterOptions] = useState([])
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

    useEffect(() => {
        const resource = history?.location?.state?.resource;
        setSelectedResource(resourceList?.filter(_r => _r?.title === resource)[0])
    }, [resourceList, history?.location?.state?.resource])

    useEffect(() => {
        if (commonSelectedResource) {
            setSelectedResource(commonSelectedResource)
        }
    }, [])

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
        setFilterOptions(FILTERS)
        let lookupResource = null
        FILTERS.forEach((f, i) => {
            if (i === 0) {
                lookupResource = f.value;
            } else {
                lookupResource = lookupResource + ',' + f.value;
            }
        });
        if (lookupResource) {
            axiosInstance()
                .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
                .then(({ data: { data } }) => {
                    setLookUpResource(data)
                })
                .catch((err) => { });
        }
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
    }, [selectedResource, selectedLookUpResourceData, dateRange]);

    const getQueryString = () => {
        const api = '/planning-view';
        const date = `{"from": "${dateRange.estimateStartDate}", "to": "${dateRange.estimateEndDate}"}`
        let query = `${api}?date=${date}`

        if (selectedResource) {
            query = `${query}&resource=${selectedResource.resource}`
        }
        if (selectedLookUpResourceData) {
            Object.keys(selectedLookUpResourceData).forEach((d) => {
                const data = queryData(selectedLookUpResourceData[d])
                query = `${query}&${d}=${data}`
            })
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
                            type: selectedResource.resource,
                            fulfillStatus: d?.fulfillStatus
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
        if (selectedResource?.title === RESOURCE_LABEL?.planning) {
            const data = FILTERS.filter(_f => _f.key !== 'asset')
            const filter = filterToKeep.filter(_f => _f.key !== 'asset')
            setFilterOptions(data)
            setFilterToKeep(filter)
        } else {
            setFilterOptions(FILTERS)
        }
        setCommonSelectedResource(selectedResource)
    }, [selectedResource]);

    useEffect(() => {
        if (selectedLookUpResourceData) {
            Object.keys(selectedLookUpResourceData).forEach(o => {
                if (!filterToKeep.some(f => f.key === o)) {
                    const { [o]: _, ...remainObj } = selectedLookUpResourceData;
                    setSelectedLookUpResourceData(remainObj)
                }
            })
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

    const setEventStyle = (obj) => {
        let backgroundColor = 'rgba(234, 239, 254, 1)';
        let color = 'rgba(4, 50, 161, 1)';
        if (obj?.type === sidebarResource.planning) {
            if (obj?.fulfillStatus === "Yes") {
                backgroundColor = "#048e0a"
                color = "white"
            }
            else if (obj?.fulfillStatus === "No") {
                backgroundColor = "#d13925"
                color = "white"
            }
            else if (obj?.fulfillStatus === "Partially") {
                backgroundColor = "#F6BE00"
                color = 'black'
            }
        }
        return {
            backgroundColor,
            color,
            borderRadius: '4px',
            border: 'none',
            padding: '8px 16px'
        };
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
                                options={filterOptions}
                                disableCloseOnSelect
                                getOptionLabel={(option) => option?.label}
                                renderOption={(option: any) => (
                                    <React.Fragment>
                                        <Checkbox checked={filterToKeep?.some(_s => _s.key === option.key)} />
                                        {option?.label}
                                    </React.Fragment>
                                )}
                                size="small"
                                renderInput={(params) => <TextField {...params} label="Filters" variant="outlined" />}
                                value={filterToKeep}
                                onChange={(event: any, newValue: any) => {
                                    setFilterToKeep(newValue)
                                }}
                            />
                        </Box>
                    </Box>
                    <Box display="flex" flexDirection="row" ml={1} mt={2}>
                        <Grid container spacing={2}>
                            {
                                filterToKeep?.map((filtered) => {
                                    return (
                                        <Grid item xs={12} sm={6} md={4} lg={4} key={filtered?.value}>
                                            <Autocomplete
                                                options={lookupResource ? lookupResource[filtered?.value] : []}
                                                multiple
                                                disableCloseOnSelect
                                                getOptionLabel={(option: any) => option?.optionLabel}
                                                value={selectedLookUpResourceData && selectedLookUpResourceData[filtered.key] ? selectedLookUpResourceData[filtered.key] : []}
                                                onChange={(event, newValue) => {
                                                    if (newValue?.length > 0) {
                                                        setSelectedLookUpResourceData(preVal => (
                                                            {
                                                                ...preVal,
                                                                [filtered.key]: newValue
                                                            }
                                                        ))
                                                    } else {
                                                        const { [filtered.key]: _, ...remainObj } = selectedLookUpResourceData;
                                                        setSelectedLookUpResourceData(remainObj)
                                                    }
                                                }}

                                                size="small"
                                                renderInput={(params) => <TextField {...params} label={`Select ${filtered?.label}`} variant="outlined" />}
                                            />
                                        </Grid>
                                    )
                                })
                            }
                        </Grid>
                    </Box>
                </Box>
                {(selectedResource?.resource === sidebarResource.rentalManagement || selectedResource?.resource === sidebarResource.planning)
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
                            const style = setEventStyle(obj)
                            return {
                                style
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
                            const style = setEventStyle(obj.type)
                            return {
                                style
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
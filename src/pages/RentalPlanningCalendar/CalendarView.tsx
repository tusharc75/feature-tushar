import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { Calendar, View, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'
import moment from 'moment';
import { Box, Grid, makeStyles } from '@material-ui/core';
import axiosInstance from 'src/axios/axiosInstance';

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

    const fetchData = () => {
        axiosInstance()
            .get(`/rental-planning-calendar?date={"to":"2/28/2023","from":"2/1/2023"}`)
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
    }, []);

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

    const defaultDate = useMemo(() => moment().toDate(), [])

    const onView = useCallback(
        (view) => {
            setView(view);
        },
        [setView]
    );

    return (
        <>
            <div className={`bgLight ${classes.whiteBg}`}>
                <Grid container className={`greyBox ${classes.topbar}`}>
                    <Grid item xs={12} sm={5}>
                        <Box display="flex" alignItems="center">

                            <Box component="span" mx={1} />
                            {['Rental Job', 'Sales Order', 'Field Service Order'].map((item) => (
                                <>
                                    <Box
                                        display="flex"
                                        bgcolor={item === 'Rental Job' ? 'rgba(255, 232, 204, 1)' : item === 'Sales Order' ? 'rgba(234, 239, 254, 1)' : 'rgba(253, 220, 228, 1)'}
                                        className={`${classes.indicators}`}
                                        style={{
                                            color: `${item === 'Rental Job' ? 'rgba(236, 85, 0, 1)' : item === 'Sales Order' ? 'rgba(4, 50, 161, 1)' : 'rgba(165, 4, 43, 1)'}`
                                        }}
                                    >
                                        {item}
                                    </Box>
                                    <Box component="span" ml={1} />
                                </>
                            ))}
                        </Box>
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
                />
            </div>
        </>
    )
}
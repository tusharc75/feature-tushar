import {
  Box,
  CircularProgress,
} from '@material-ui/core';
import moment from 'moment';
import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { Calendar, View, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, workOrderSupervisor } from 'src/constants/helpers';
import '../PlanningView/Calendar/calendarView.scss';
import { useData } from 'src/StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import TechnicianDialog from 'src/pages/WorkOrderTechnician/TechnicianDialog';
import { kebabCase } from 'lodash';

const localizer = momentLocalizer(moment);
const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

function WorkOrderCalendar( {getFilterQuery, filterResourceQuery, reference}, ref ) {
  const {
    state: { permissions }
  }: any = useData();

  const [themeMode] = useAppTheme();
  const toastConfig = useContext(CustomToastContext);
  const mobileView = isMobile && !isTablet;

  const [events, setEvents] = useState([]);
  const [view, setView] = useState<View>(mobileView ? 'day' : 'month');

  const [renderCount, setRenderCount] = useState(0);
  const defaultDate = useMemo(() => moment().toDate(), []);

  const [dateRange, setDateRange] = useState({
    estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
  });

  const [month, setMonth] = useState({
    startDate: moment().startOf('month').format('MM/DD/YYYY'),
    endDate: moment().endOf('month').format('MM/DD/YYYY')
  });
  const [week, setWeek] = useState({
    startDate: moment().startOf('week').format('MM/DD/YYYY'),
    endDate: moment().endOf('week').format('MM/DD/YYYY')
  });
  const [day, setDay] = useState({
    startDate: moment().startOf('day').format('MM/DD/YYYY'),
    endDate: moment().endOf('day').format('MM/DD/YYYY')
  });

  const [agenda, setAgenda] = useState({
    startDate: moment().startOf('day').format('MM/DD/YYYY'),
    endDate: moment().add(1, 'months').format('MM/DD/YYYY')
  });

  const [isOpen, setOpen] = useState({ open: false, id: null });
  const [isDataFetching, setIsDataFetching] = useState(false);

  useEffect(() => {
    if (view === 'month') {
      setMonth({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    } else if (view === 'week') {
      setWeek({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    } else if (view === 'day') {
      setDay({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    } else if (view === 'agenda') {
      setAgenda({
        startDate: dateRange.estimateStartDate,
        endDate: dateRange.estimateEndDate
      });
    }
  }, [dateRange]);

  useEffect(() => {
      fetchData();
  }, [filterResourceQuery, dateRange, reference]);

  const childFunction = () => {
    fetchData();
  };

  useImperativeHandle(ref, () => ({
    childFunction
  }));

  const fetchData = () => {
    setIsDataFetching(true);
    let query = getFilterQuery(false);
    query = `${query}&from=${dateRange.estimateStartDate}&to=${dateRange.estimateEndDate}`;
    axiosInstance()
      .get(`${workOrderSupervisor.api}/${kebabCase(reference)}?${query}`)
      .then(({ data: { data } }) => {
        const rows = data?.map((d: any) => {
          if(reference==='repairOrder'){
            return {
              id: d._id,
              title: d?.repairOrderNumber,
              start: new Date(d?.createDate),
              end: new Date(d?.expectedCompletionDate),
              allDay: true,
              startDraggable: false,
              endDraggable: false
            };
          }else {
            return {
              id: d._id,
              title: d?.workOrderNumber,
              start: new Date(d?.createDate),
              end: d?.estimateCompleteDate ? new Date(d?.estimateCompleteDate) : new Date(d?.createDate),
              allDay: true,
              startDraggable: false,
              endDraggable: false
            };
          }
        });

        setEvents([...rows]);
      })
      .catch((err) => {})
      .finally(() => setIsDataFetching(false));
  };

  useEffect(() => {
    if (renderCount !== 0) {
      if (view === 'month') {
        setDateRange({
          estimateStartDate: month.startDate,
          estimateEndDate: month.endDate
        });
      } else if (view === 'week') {
        setDateRange({
          estimateStartDate: week.startDate,
          estimateEndDate: week.endDate
        });
      } else if (view === 'day') {
        setDateRange({
          estimateStartDate: day.startDate,
          estimateEndDate: day.endDate
        });
      } else if (view === 'agenda') {
        setDateRange({
          estimateStartDate: agenda.startDate,
          estimateEndDate: agenda.endDate
        });
      }
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [view]);

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
  };

  const setEventStyle = () => {
    let backgroundColor = themeMode === 'light' ? 'rgb(234, 239, 254)' : 'rgb(185, 183, 219)';
    let color = '#000';

    return {
      backgroundColor,
      color,
      borderRadius: '4px',
      border: 'none',
      padding: '8px 16px'
    };
  };

  return (
    <>
      <div>
        <Box display="flex" flexDirection="column">
        </Box>
        <div className={cn('relative')}>
            <Calendar
                defaultDate={defaultDate}
                key={mobileView ? 'mobile' : 'desktop'}
                defaultView={mobileView ? 'day' : 'month'}
                events={events}
                formats={formats}
                localizer={localizer}
                popup={!(isMobile || isTablet)}
                messages={{
                  agenda: 'List'
                }}
                views={mobileView ? ['day', 'agenda'] : ['month', 'week', 'day', 'agenda']}
                onView={setView}
                view={view}
                eventPropGetter={(obj: any) => {
                  const style = setEventStyle();
                  return {
                    style
                  };
                }}
                onNavigate={(date) => {
                  onNavigate(date);
                }}
                onSelectEvent={(data: any, event: any) => {
                  setOpen({ open: true, id: data.id });
                }}
              />
          {isDataFetching && (
            <span className={cn('absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50')}>
              <CircularProgress />
            </span>
          )}
        </div>
        {isOpen.open && (
           <TechnicianDialog
           handleClose={() => {
            setOpen({open: false, id: null})
           }}
           workOrderId={isOpen?.id}
           uniqueId={null}
           canPerform={false}
         />
       )}
      </div>
    </>
  );
}

export default forwardRef(WorkOrderCalendar);


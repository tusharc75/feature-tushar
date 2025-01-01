import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import dayjs from 'dayjs';
import { useCallback, useContext, useEffect, useState } from 'react';
import { View, dayjsLocalizer } from 'react-big-calendar';
import axiosInstance from 'src/axios/axiosInstance';
import CustomCalendar from 'src/components/CustomCalendar';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

type Props = {};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const useStyles = makeStyles((theme: Theme) => ({
  topbar: {
    backgroundColor: 'var(--dark-secondary, #fff)',
    padding: '10px 10px',
    borderRadius: '3px',
    alignItems: 'center'
  },
  whiteBg: {
    backgroundColor: 'var(--dark-secondary, #fff)'
  },
  indicators: {
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    lineHeight: '17px'
  }
}));

const CalendarView = (props: Props) => {
  const classes = useStyles();
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState();
  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
  });
  const [view, setView] = useState<View>('month');
  const [converPlanning, setConvertPlanning] = useState({ open: false, data: null });
  const toastConfig = useContext(CustomToastContext);

  useEffect(() => {
    axiosInstance()
      .get(`${routes?.planning.path}?entity=${selectedEntity}`)
      .then(({ data: { data } }) => {
        const eventsData = data.data
          .filter((d) => d.status === 'Open')
          .map((d: any) => ({
            id: d._id,
            title: d.planningNumber,
            start: d.startDate,
            end: d.endDate,
            allDay: true,
            type: d.type
          }));
        setEvents(eventsData);
      })
      .catch((err) => {});
  }, []);

  const onRangeChange = useCallback(
    (range, view) => {
      setRange(range);
    },
    [setRange]
  );

  const onView = useCallback(
    (view) => {
      setView(view);
    },
    [setView]
  );

  const localizer = dayjsLocalizer(dayjs);

  return (
    <>
      <div className={`${classes.whiteBg}`}>
        <div className="flex flex-wrap gap-[8px] py-[10px]">
          {['Rental Job', 'Sales Order', 'Field Service Order'].map((item) => (
            <>
              <Box
                display="flex"
                bgcolor={
                  item === 'Rental Job' ? 'rgba(255, 232, 204, 1)' : item === 'Sales Order' ? 'rgba(234, 239, 254, 1)' : 'rgba(253, 220, 228, 1)'
                }
                className={`${classes.indicators}`}
                style={{
                  color: `${item === 'Rental Job' ? 'rgba(236, 85, 0, 1)' : item === 'Sales Order' ? 'rgba(4, 50, 161, 1)' : 'rgba(165, 4, 43, 1)'}`
                }}
              >
                {item}
              </Box>
            </>
          ))}
        </div>
        <div className="relative">
          <CustomCalendar
            defaultDate={dayjs().toDate()}
            defaultView="day"
            events={events}
            localizer={localizer}
            formats={formats}
            popup={true}
            onNavigate={(date) => {
              // if (view === 'month') {
              //   setDateRange({
              //     estimateStartDate: dayjs(date).startOf('month').format('MM/DD/YYYY'),
              //     estimateEndDate: dayjs(date).endOf('month').format('MM/DD/YYYY')
              //   });
              // }
            }}
            views={['month', 'week', 'day']}
            eventPropGetter={(obj) => {
              const newStyles = {
                backgroundColor:
                  obj.type === 'Rental Job'
                    ? 'rgba(255, 232, 204, 1)'
                    : obj.type === 'Sales Order'
                      ? 'rgba(234, 239, 254, 1)'
                      : 'rgba(253, 220, 228, 1)',
                color: obj.type === 'Rental Job' ? 'rgba(236, 85, 0, 1)' : obj.type === 'Sales Order' ? 'rgba(4, 50, 161, 1)' : 'rgba(165, 4, 43, 1)',
                borderRadius: '4px',
                border: 'none',
                padding: '8px 16px'
              };

              return {
                style: newStyles
              };
            }}
            onSelectEvent={(event: any) => {
              setConvertPlanning({
                open: true,
                data: event
              });
            }}
            onRangeChange={onRangeChange}
            onView={onView}
            view={view}
          />
        </div>
      </div>
      {converPlanning.open && (
        <ConfirmationDialog
          open={converPlanning.open}
          message={`Are you sure you want to convert  ${converPlanning?.data?.title || ''} to ${converPlanning?.data?.type || ''} ?`}
          onClose={() => {
            setConvertPlanning({
              open: false,
              data: null
            });
          }}
          onOk={() => {
            axiosInstance()
              .post(`${routes?.planning?.path}/convert-planning`, { id: converPlanning?.data?.id })
              .then(({ data }) => {
                setConvertPlanning({
                  open: false,
                  data: null
                });
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data?.message
                });
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          }}
        />
      )}
    </>
  );
};

export default CalendarView;

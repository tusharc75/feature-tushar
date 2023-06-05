import { useCallback, useContext, useEffect, useState } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { Box, Grid, makeStyles } from '@material-ui/core';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const localizer = momentLocalizer(moment);

type Props = {};

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

const useStyles = makeStyles((theme) => ({
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
    estimateStartDate: moment().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: moment().endOf('month').format('MM/DD/YYYY')
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
    (range) => {
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

  return (
    <>
      <div className={`${classes.whiteBg}`}>
        <Grid container className={` ${classes.topbar}`}>
          <Grid item xs={12} sm={5}>
            <Box display="flex" alignItems="center">
              <Box component="span" mx={1} />
              {['Rental Job', 'Sales Order', 'Field Service Order'].map((item) => (
                <>
                  <Box
                    display="flex"
                    bgcolor={
                      item === 'Rental Job' ? 'rgba(255, 232, 204, 1)' : item === 'Sales Order' ? 'rgba(234, 239, 254, 1)' : 'rgba(253, 220, 228, 1)'
                    }
                    className={`${classes.indicators}`}
                    style={{
                      color: `${
                        item === 'Rental Job' ? 'rgba(236, 85, 0, 1)' : item === 'Sales Order' ? 'rgba(4, 50, 161, 1)' : 'rgba(165, 4, 43, 1)'
                      }`
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
        <Calendar
          defaultDate={moment().toDate()}
          defaultView="day"
          events={events}
          localizer={localizer}
          formats={formats}
          popup={true}
          onNavigate={(date) => {
            // if (view === 'month') {
            //   setDateRange({
            //     estimateStartDate: moment(date).startOf('month').format('MM/DD/YYYY'),
            //     estimateEndDate: moment(date).endOf('month').format('MM/DD/YYYY')
            //   });
            // }
          }}
          views={{ month: true, week: true, day: true }}
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

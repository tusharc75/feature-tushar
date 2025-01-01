import { ExpandMore } from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  ListItem,
  Popover,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import dayjs from 'dayjs';
import { kebabCase } from 'lodash';
import { forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { View, dayjsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import CustomCalendar from 'src/components/CustomCalendar';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, workOrderSupervisor } from 'src/constants/helpers';
import '../PlanningView/Calendar/calendarView.scss';

const formats = {
  weekdayFormat: (date, culture, localizer) => localizer.format(date, 'dddd', culture)
};

function WorkOrderCalendar({ getFilterQuery, filterQuery, reference, setOpen }, ref) {
  const {
    state: { resources }
  }: any = useData();

  const [themeMode] = useAppTheme();
  const toastConfig = useContext(CustomToastContext);
  const mobileView = isMobile && !isTablet;

  const [events, setEvents] = useState([]);
  const [view, setView] = useState<View>(mobileView ? 'day' : 'month');

  const [renderCount, setRenderCount] = useState(0);
  const defaultDate = useMemo(() => dayjs().toDate(), []);

  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
  });

  const [isDataFetching, setIsDataFetching] = useState(false);
  const [openRepairPopup, setOpenRepairPopup] = useState({ open: false, data: null });
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterQuery, dateRange, reference]);

  const childFunction = () => {
    fetchData();
  };

  useImperativeHandle(ref, () => ({
    childFunction
  }));

  const fetchRepairOrderCompetencies = (id: string) => {
    setIsDataFetching(true);
    axiosInstance()
      .get(`${workOrderSupervisor.api}/repair-order-service-competencies/${id}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setOpenRepairPopup({ open: true, data: data });
        }
      })
      .catch((err) => { })
      .finally(() => setIsDataFetching(false));
  };

  const fetchData = () => {
    setIsDataFetching(true);
    let query = getFilterQuery(false);
    query = `${query}&from=${dateRange.estimateStartDate}&to=${dateRange.estimateEndDate}`;
    axiosInstance()
      .get(`${workOrderSupervisor.api}/${kebabCase(reference)}?${query}`)
      .then(({ data: { data } }) => {
        const rows = data?.map((d: any) => {
          if (reference === 'repairOrder') {
            return {
              id: d._id,
              title: d?.repairOrderNumber,
              start: new Date(d?.createDate),
              end: d?.expectedCompletionDate ? new Date(d?.expectedCompletionDate) : new Date(d?.createDate),
              allDay: true,
              startDraggable: false,
              endDraggable: false
            };
          } else {
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
      .catch((err) => { })
      .finally(() => setIsDataFetching(false));
  };

  useEffect(() => {
    if (renderCount !== 0) {
      onNavigate(new Date());
    } else {
      setRenderCount(renderCount + 1);
    }
  }, [view]);

  const onNavigate = (date) => {
    if (view === 'month') {
      setDateRange({
        estimateStartDate: dayjs(date).startOf('month').format('MM/DD/YYYY'),
        estimateEndDate: dayjs(date).endOf('month').format('MM/DD/YYYY')
      });
    } else if (view === 'week') {
      setDateRange({
        estimateStartDate: dayjs(date).startOf('week').format('MM/DD/YYYY'),
        estimateEndDate: dayjs(date).endOf('week').format('MM/DD/YYYY')
      });
    } else if (view === 'day') {
      setDateRange({
        estimateStartDate: dayjs(date).format('MM/DD/YYYY'),
        estimateEndDate: dayjs(date).format('MM/DD/YYYY')
      });
    } else if (view === 'agenda') {
      setDateRange({
        estimateStartDate: dayjs(date).format('MM/DD/YYYY'),
        estimateEndDate: dayjs(date).add(1, 'months').format('MM/DD/YYYY')
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

  const localizer = dayjsLocalizer(dayjs);

  return (
    <>
      <div className={cn('relative min-h-[400px] [&_.rbc-toolbar]:pt-0')}>
        <CustomCalendar
          defaultDate={defaultDate}
          defaultView={'month'}
          events={events}
          formats={formats}
          localizer={localizer}
          popup={!(isMobile || isTablet)}
          messages={{
            agenda: 'List'
          }}
          views={['month', 'week', 'day', 'agenda']}
          onView={setView}
          view={view}
          eventPropGetter={(obj: any) => {
            const style = setEventStyle();
            return {
              style
            };
          }}
          components={{
            agenda: {
              event: ({ event }) => <EventAgenda event={event} setOpen={setOpen} />
            }
          }}
          onNavigate={(date) => {
            onNavigate(date);
          }}
          onSelectEvent={(data: any, event: any) => {
            if (reference === 'repairOrder') {
              fetchRepairOrderCompetencies(data.id);
              setAnchor(event.nativeEvent.target);
            } else {
              setOpen({ open: true, id: data.id });
            }
          }}
        />

        {isDataFetching && (
          <span className={cn('absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50')}>
            <CircularProgress />
          </span>
        )}
      </div>
      {openRepairPopup.open && (
        <Popover
          open={openRepairPopup.open}
          anchorEl={anchor}
          onClose={() => {
            setOpenRepairPopup({ open: false, data: null });
          }}
          style={{ minWidth: '300px' }}
        >
          <Box className="max-h-[600px] space-y-2  overflow-y-auto overflow-x-hidden p-2">
            {openRepairPopup.data?.length
              ? openRepairPopup.data?.map((d) => (
                <Accordion key={d._id} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <div className="flex items-center gap-2">
                      <p className="text-truncate" title={d.workOrderNumber}>
                        {d.workOrderNumber}
                      </p>
                      <IconButton
                        size="small"
                        onClick={() => {
                          window.open(`${routes?.workOrderDetail?.path}/${d?._id}`);
                        }}
                      >
                        <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                      </IconButton>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    <RenderTable data={d.competencies} resources={resources} />
                  </AccordionDetails>
                </Accordion>
              ))
              : null}
          </Box>
        </Popover>
      )}
    </>
  );
}

function EventAgenda({ event, setOpen }) {
  return (
    <ListItem
      button
      component={'p'}
      className="!-mx-[10px] !-my-[5px] !w-[calc(100%+20px)] cursor-pointer hover:bg-[var(--dark-secondary,gray)]"
      onClick={() => setOpen({ open: true, id: event.id })}
    >
      <span>{event.title}</span>
      <span className="font-normal text-gray-500">{event.desc}</span>
    </ListItem>
  );
}

export default forwardRef(WorkOrderCalendar);

const RenderTable = ({ data, resources }) => {
  return (
    <TableContainer>
      <Table className="min-w-[530px]" aria-label="simple table" size="small">
        <TableHead>
          <TableRow>
            <TableCell>{resources?.competencies?.titlePlural}</TableCell>
            <TableCell>Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row?.competency?.optionValue}>
              <TableCell component="th" scope="row">
                <div className="flex items-center gap-2">
                  <p className="text-truncate" title={row?.competency?.optionLabel}>
                    {row.competency?.optionLabel}
                  </p>
                  <IconButton
                    size="small"
                    onClick={() => {
                      window.open(`${routes.competenciesDetail.path}/${row?.competency?.optionValue}`);
                    }}
                  >
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                </div>
              </TableCell>
              <TableCell component="th" scope="row">
                {row.count}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

import { DatesSetArg } from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
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
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { isMobile, isTablet } from 'react-device-detect';
import { FiExternalLink } from 'react-icons/fi';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import CustomCalendar from 'src/components/CustomCalendar';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, sidebarResource, workOrderSupervisor } from 'src/constants/helpers';

function WorkOrderCalendar({ filterQuery, reference, setOpen }, ref) {
  const {
    state: { resources }
  }: any = useData();

  const [themeMode] = useAppTheme();

  const [events, setEvents] = useState([]);
  const calendarRef = useRef<FullCalendar>(null);

  // useEffect(() => {
  //   if (mobileView) {
  //     calendarRef.current?.getApi().changeView('timeGridDay');
  //   } else {
  //     calendarRef.current?.getApi().changeView('dayGridMonth');
  //   }
  // }, [mobileView]);

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

  const fetchCompetencies = (id: string) => {
    setIsDataFetching(true);
    axiosInstance()
      .get(`${workOrderSupervisor.api}/competencies/${id}?resource=${reference}`)
      .then(({ data: { data } }) => {
        if (data?.length) {
          setOpenRepairPopup({ open: true, data: data });
        }
      })
      .catch((err) => {})
      .finally(() => setIsDataFetching(false));
  };

  const fetchData = () => {
    setIsDataFetching(true);
    const urlParams = new URLSearchParams(filterQuery);
    urlParams.delete('from');
    urlParams.delete('to');
    const query = `${urlParams.toString()}&from=${dateRange.estimateStartDate}&to=${dateRange.estimateEndDate}&resource=${reference}`;
    axiosInstance()
      .get(`${workOrderSupervisor.api}?${query}`)
      .then(({ data: { data } }) => {
        const rows = data?.map((d: any) => ({
          id: d._id,
          title:
            reference === sidebarResource?.repairOrder
              ? d?.repairOrderNumber
              : reference === sidebarResource?.productionOrder
                ? d?.productionOrderNumber
                : reference === sidebarResource?.assemblyOrder
                  ? d?.assemblyOrderNumber
                  : d?.workOrderNumber,
          start: new Date(d?.createDate),
          end: d?.expectedCompletionDate ? new Date(d?.expectedCompletionDate) : new Date(d?.createDate),
          allDay: true,
          startDraggable: false,
          endDraggable: false
        }));
        setEvents([...rows]);
      })
      .catch((err) => {})
      .finally(() => setIsDataFetching(false));
  };

  const onNavigate = useCallback((dateInfo: DatesSetArg) => {
    if (dateInfo.view.type === 'dayGridMonth') {
      setDateRange({
        estimateStartDate: dayjs(dateInfo.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs(dateInfo.end).tz().format('MM/DD/YYYY')
      });
    } else if (dateInfo.view.type === 'timeGridWeek') {
      setDateRange({
        estimateStartDate: dayjs(dateInfo.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs(dateInfo.end).tz().format('MM/DD/YYYY')
      });
    } else if (dateInfo.view.type === 'timeGridDay') {
      setDateRange({
        estimateStartDate: dayjs(dateInfo.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs(dateInfo.end).tz().format('MM/DD/YYYY')
      });
    } else if (dateInfo.view.type === 'agenda') {
      setDateRange({
        estimateStartDate: dayjs(dateInfo.start).tz().format('MM/DD/YYYY'),
        estimateEndDate: dayjs(dateInfo.end).tz().add(1, 'month').format('MM/DD/YYYY')
      });
    }
  }, []);

  const eventStyle = useMemo(() => {
    let backgroundColor = themeMode === 'light' ? 'rgb(234, 239, 254)' : 'rgb(185, 183, 219)';
    let color = '#000000';
    let textColor = '#000000';

    return {
      backgroundColor,
      color,
      borderColor: 'transparent',
      textColor
    };
  }, [themeMode]);

  return (
    <>
      <div className={cn('relative min-h-[400px] [&_.rbc-toolbar]:pt-0')}>
        <CustomCalendar
          events={events}
          // ref={calendarRef}
          getEventStyle={() => {
            return eventStyle;
          }}
          // components={{
          //   agenda: {
          //     event: ({ event }) => <EventAgenda event={event} setOpen={setOpen} />
          //   }
          // }}
          onNavigate={onNavigate}
          eventClick={(arg) => {
            if ([sidebarResource.repairOrder, sidebarResource.productionOrder, sidebarResource.assemblyOrder]?.includes(reference)) {
              fetchCompetencies(arg.event.id);
              setAnchor(arg.el);
            } else {
              setOpen({ open: true, id: arg.event.id });
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

import { Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomCalendar from 'src/components/CustomCalendar';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { ListingPageHeader } from 'src/components/PageHeaders';
import ManageContentPostPlanning from '../ManageContentPostPlanning';
import { useHistory } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import ButtonMenu from 'src/components/ButtonMenu';
import { CONTENT_POST_PLANNING_STATUS } from 'src/constants/helpers';
import { NewActionButtonProps } from 'src/components/PageHeaders/DetailsPageHeader/NewActionButton';
import { HourglassEmpty, CheckCircle, Schedule, Category } from '@mui/icons-material';
import { gridFilterParser } from 'src/components/CustomReactTable';
import { DatesSetArg } from '@fullcalendar/core';
import dayjs from 'dayjs';
import ViewListIcon from '@mui/icons-material/ViewList';

const useStyles = makeStyles((theme: Theme) => ({
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

const CalendarView = ({ topRightSlot }) => {
  const classes = useStyles();
  const {
    state: { selectedEntity, permissions, filters },
    dispatch
  }: any = useData();
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isEdit: false, idToEdit: null });
  const [events, setEvents] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const [selectedStatus, setSelectedStatus] = useState(localStorage.getItem('contentPostPlanningStatus') || "All");

  const [dateRange, setDateRange] = useState({
    estimateStartDate: dayjs().startOf('month').format('MM/DD/YYYY'),
    estimateEndDate: dayjs().endOf('month').format('MM/DD/YYYY')
  });

  const getQueryString = () => {
    let deepFilter = `?entity=${selectedEntity}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedStatus && selectedStatus !== '' && selectedStatus !== 'Others' && selectedStatus !== 'All') {
      deepFilters.push({ field: 'status', term: selectedStatus });
    }
    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }
    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    return deepFilter;
  };

  const fetchData = async () => {
    try {
      dispatch({ type: 'loading', loading: true });
      const queryString = getQueryString();
      const {
        data: {
          data: { data, count }
        }
      } = await axiosInstance().get(`/content-post-planning${queryString}`);
      const eventsData = data.map((item: any) => ({
        id: item._id,
        title: `${item.title || ''}`,
        start: dayjs.utc(item.dateTime).tz().format(),
        allDay: true,
        status: item.status
      }));
      setEvents(eventsData);
      dispatch({ type: 'initialize', data, count });
      dispatch({ type: 'loading', loading: false });
    } catch (error: any) {
      dispatch({ type: 'loading', loading: false });
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEntity, selectedStatus, filters, dateRange]);

  const getEventStyle = useCallback((obj) => {
    let bg = 'rgba(237, 231, 246, 1)';
    let color = 'rgba(74, 20, 140, 1)';

    if (obj.status === 'Pending Approval') {
      bg = 'rgba(255, 243, 205, 1)';
      color = 'rgba(133, 100, 4, 1)';
    } else if (obj.status === 'Published') {
      bg = 'rgba(204, 255, 213, 1)';
      color = 'rgba(0, 100, 36, 1)';
    } else if (obj.status === 'Scheduled') {
      bg = 'rgba(209, 233, 252, 1)';
      color = 'rgba(1, 67, 97, 1)';
    }

    return {
      backgroundColor: bg,
      color,
      textColor: color,
      borderRadius: '4px',
      borderColor: 'transparent',
      padding: '8px 16px'
    };
  }, []);

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

  const resolvedTopRight = typeof topRightSlot === 'function' ? (topRightSlot as Function)() : topRightSlot;
  const statusMenuItems = useMemo(() => {
    return [
      {
        label: 'All',
        selected: selectedStatus === 'All',
        value: 'All',
        startIcon: <ViewListIcon color="action" fontSize="small" />
      },
      {
        label: CONTENT_POST_PLANNING_STATUS.pendingApproval,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.pendingApproval,
        value: CONTENT_POST_PLANNING_STATUS.pendingApproval,
        startIcon: <HourglassEmpty color="warning" fontSize="small" />
      },
      {
        label: CONTENT_POST_PLANNING_STATUS.scheduled,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.scheduled,
        value: CONTENT_POST_PLANNING_STATUS.scheduled,
        startIcon: <Schedule color="info" fontSize="small" />
      },
      {
        label: CONTENT_POST_PLANNING_STATUS.published,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.published,
        value: CONTENT_POST_PLANNING_STATUS.published,
        startIcon: <CheckCircle color="success" fontSize="small" />
      }
    ] as NewActionButtonProps<string, any>['items'];
  }, [selectedStatus]);

  return (
    <>
      <ListingPageHeader
        rightSideContents={resolvedTopRight}
        leftSideContents={
          <ButtonMenu
            showChevron={true}
            items={statusMenuItems}
            onItemClick={(e, item) => {
              setSelectedStatus(item.value);
              localStorage.setItem('contentPostPlanningStatus', item.value);
            }}
          >
            <span className="flex items-center gap-2 [&_svg]:text-[18px]">Status: {selectedStatus}</span>
          </ButtonMenu>
        }
        isActionButtonVisible={false}
        addButtonOnclick={() => {
          setShowManageDialog({ open: true, isEdit: false, idToEdit: null });
        }}
        isAddButtonVisible={permissions?.contentPostPlanning?.isCreate}
      />
      <div className={classes.whiteBg}>
        <div className="relative">
          <CustomCalendar
            events={events}
            getEventStyle={getEventStyle}
            onNavigate={onNavigate}
            eventClick={(arg) => {
              const ev = arg.event;
              const id = ev.id || ev._def?.publicId || ev.extendedProps?.id;
              if (id) {
                history.push(`${routes.contentPostPlanningDetail.path}/${id}`);
              } else {
                console.warn('Calendar event clicked but id not found', ev);
              }
            }}
          />
        </div>
      </div>
      {showManageDialog.open && (
        <ManageContentPostPlanning
          open={showManageDialog.open}
          isEdit={showManageDialog.isEdit}
          idToEdit={showManageDialog.idToEdit}
          onClose={() => setShowManageDialog({ open: false, isEdit: false, idToEdit: null })}
          onSuccess={(data: any) => {
            setShowManageDialog({ open: false, isEdit: false, idToEdit: null });
            fetchData();
          }}
        />
      )}
    </>
  );
};

export default CalendarView;

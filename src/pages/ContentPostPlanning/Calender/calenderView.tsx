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
  const [selectedStatus, setSelectedStatus] = useState(CONTENT_POST_PLANNING_STATUS.pendingApproval);

  const getQueryString = () => {
    let deepFilter = `?entity=${selectedEntity}`;

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (selectedStatus && selectedStatus !== '' && selectedStatus !== 'Others') {
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
        start: item.dateTime,
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
  }, [selectedEntity, selectedStatus, filters]);

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

  const resolvedTopRight = typeof topRightSlot === 'function' ? (topRightSlot as Function)() : topRightSlot;
  const statusMenuItems = useMemo(() => {
    return [
      {
        label: CONTENT_POST_PLANNING_STATUS.pendingApproval,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.pendingApproval,
        value: CONTENT_POST_PLANNING_STATUS.pendingApproval,
        startIcon: <HourglassEmpty color="warning" fontSize="small" />
      },
      {
        label: CONTENT_POST_PLANNING_STATUS.published,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.published,
        value: CONTENT_POST_PLANNING_STATUS.published,
        startIcon: <CheckCircle color="success" fontSize="small" />
      },
      {
        label: CONTENT_POST_PLANNING_STATUS.scheduled,
        selected: selectedStatus === CONTENT_POST_PLANNING_STATUS.scheduled,
        value: CONTENT_POST_PLANNING_STATUS.scheduled,
        startIcon: <Schedule color="info" fontSize="small" />
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
          {events.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No events found for the selected status</div>
          ) : (
            <CustomCalendar
              events={events}
              getEventStyle={getEventStyle}
              onNavigate={() => {}}
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
          )}
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

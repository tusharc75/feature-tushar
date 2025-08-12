import { Box, Theme } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomCalendar from 'src/components/CustomCalendar';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import { ListingPageHeader } from 'src/components/PageHeaders';
import ManageContentPostPlanning from '../ManageContentPostPlanning';
import { useHistory } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';

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
        state: { selectedEntity, permissions, user },
        dispatch
    }: any = useData();
    const [showManageDialog, setShowManageDialog] = useState({ open: false, isEdit: false, idToEdit: null });
    const [events, setEvents] = useState([]);
    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    const fetchData = async () => {
        try {
            dispatch({ type: 'loading', loading: true });
            const queryString = `?entity=${selectedEntity}`;
            const { data: { data: { data, count } } } = await axiosInstance().get(`/content-post-planning${queryString}`);

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
    }, [selectedEntity]);

    const getEventStyle = useCallback((obj) => {
        let bg = 'rgba(234, 239, 254, 1)';
        let color = 'rgba(4, 50, 161, 1)';

        if (obj.status === 'Pending approval') {
            bg = 'rgba(255, 232, 204, 1)';
            color = 'rgba(236, 85, 0, 1)';
        } else if (obj.status === 'Published') {
            bg = 'rgba(204, 255, 213, 1)';
            color = 'rgba(0, 100, 36, 1)';
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

    const resolvedTopRight =
        typeof topRightSlot === 'function' ? (topRightSlot as Function)() : topRightSlot;



    return (
        <>
            <ListingPageHeader
                rightSideContents={resolvedTopRight}
                isActionButtonVisible={false}
                addButtonOnclick={() => {
                    setShowManageDialog({ open: true, isEdit: false, idToEdit: null });
                }}
                isAddButtonVisible={permissions?.contentPostPlanning?.isCreate}
            />
            <div className={classes.whiteBg}>
                <div className="flex flex-wrap gap-[8px] py-[10px]">
                    {['Pending approval', 'Published', 'Scheduled'].map((status) => (
                        <Box
                            key={status}
                            display="flex"
                            bgcolor={
                                status === 'Pending approval'
                                    ? 'rgba(255, 232, 204, 1)'
                                    : status === 'Published'
                                        ? 'rgba(204, 255, 213, 1)'
                                        : 'rgba(253, 220, 228, 1)'
                            }
                            className={classes.indicators}
                            style={{
                                color:
                                    status === 'Pending approval'
                                        ? 'rgba(236, 85, 0, 1)'
                                        : status === 'Published'
                                            ? 'rgba(0, 100, 36, 1)'
                                            : 'rgba(165, 4, 43, 1)'
                            }}
                        >
                            {status}
                        </Box>
                    ))}
                </div>
                <div className="relative">
                    <CustomCalendar
                        events={events}
                        getEventStyle={getEventStyle}
                        onNavigate={() => { }}
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

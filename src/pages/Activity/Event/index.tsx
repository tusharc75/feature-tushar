import { Box, Dialog } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Add } from '@mui/icons-material';
import axios, { CancelTokenSource } from 'axios';
import queryString from 'query-string';
import { Fragment, useCallback, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import { CreateEvent } from '../../../components/Activity/Event/CreateEvent';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import { SearchFilter } from '../../../components/SearchFilter';
import MyCalendar from '../Calendar/MyCalendar';
import { CustomDialogTransition } from 'src/constants/helpers';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import dayjs from 'dayjs';

const Event = () => {
  const history = useHistory();
  const { setToastConfig } = useContext(CustomToastContext);
  const {
    state: {
      user: { user, permissions }
    }
  } = useData();
  const [filter, setFilter] = useState([]);
  const [activityData, setActivityData] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [events, setEvents] = useState([]);
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;

  useEffect(() => {
    if (referenceType) {
      axiosInstance()
        .get(`/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`)
        .then(({ data: { data } }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => { });
    }
  }, [referenceId]);

  const fetchBoard = useCallback(
    (cancelTokenSource?: CancelTokenSource) => {
      axiosInstance()
        .get(`/activity/board?type=event&filter=${JSON.stringify(filter)}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data } }) => {
          const newData = data.map((d) => ({
            ...d,
            title: d.name,
            start: d.startDate ? dayjs(d.startDate) : dayjs(),
            end: d.dueDate ? dayjs(d.dueDate) : dayjs().add(20, 'day')
          }));

          setEvents(newData);
        })
        .catch((err) => {
          setToastConfig(err);
        });
    },
    [filter]
  );

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchBoard(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [fetchBoard]);

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleClose = () => {
    setActivityData(null);
    setOpenDialog(false);

    fetchBoard();
  };

  return (
    <Fragment>
      <Grid container className="headerbox ">
        <CustomBreadCrumbs routes={[{ title: 'Activity', path: '/activity' }, { title: 'Event' }]} />
      </Grid>
      <CustomContainer>
        <div className="detailContainer">
          <Box p={1}>
            <Box mb={2} display="flex" alignItems="center">
              <Box mr={2} minWidth="150px" height="100%">
                <ThemeButton fullWidth startIcon={<Add />} onClick={() => setOpenDialog(true)}>
                  Create Event
                </ThemeButton>
              </Box>
              <SearchFilter
                handleChangeFilter={handleChangeFilter}
                filter={filter}
                chip={{ size: 'small', color: 'primary' }}
                activityName="event"
              />
            </Box>

            <MyCalendar
              activities={events}
              setActivityData={(event: any) => {
                setActivityData(event);
                setOpenDialog(true);
              }}
              type="event"
            />
            <Dialog
              open={openDialog}
              TransitionComponent={CustomDialogTransition}
              onClose={(e, reason) => {
                if (reason !== 'backdropClick') {
                  handleClose();
                }
              }}
              maxWidth="md"
            >
              <CreateEvent
                eventId={activityData ? activityData.id : null}
                handleClose={handleClose}
                isMinimized={false}
                onMinimizeMaximize={() => { }}
                showManimizeMaximize={false}
              />
            </Dialog>
          </Box>
        </div>
      </CustomContainer>
    </Fragment>
  );
};

export default Event;

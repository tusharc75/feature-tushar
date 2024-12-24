import { useCallback, useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import moment from 'moment';
import { useLocation, useHistory } from 'react-router-dom';

import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { ListRelatedTo } from '../../components/Activity/Helpers/ListRelatedTo';
import ActivityModelHandler from '../../components/Activity/ActivityModelHandler';
import routes from '../../components/Helpers/Routes';
import { DateRange } from '@mui/icons-material';
import { useData } from 'src/StateProvider/Provider';

const Reminder = () => {
  const history = useHistory();

  const {
    state: { resources }
  }: any = useData();

  const { state } = useLocation();
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingCases, setLoadingCases] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  let searchData: any = window.location.search;
  searchData = searchData ? searchData.split('?') : null;
  searchData = searchData ? searchData[1].split('&') : null;
  searchData = searchData
    ? searchData.map((q) => {
        let obj: any = {};
        if (q.includes('type')) {
          obj['type'] = q.split('=')[1];
        }
        if (q.includes('id')) {
          obj['id'] = q.split('=')[1];
        }
        return obj;
      })
    : null;
  searchData = searchData ? Object.assign({}, { ...searchData[0], ...searchData[1] }) : null;

  useEffect(() => {
    if (!state) return;

    if (state) {
      const { data } = state;
      setSelectedActivity({ type: data?.type, id: data?._id });
    }
  }, [state]);

  useEffect(() => {
    if (!searchData) return;

    if (searchData && !selectedActivity) {
      setSelectedActivity(searchData);
    }
  }, [searchData]);

  const fetchTasks = useCallback(() => {
    axiosInstance()
      .get('/task/my')
      .then(({ data: { data } }) => {
        setLoadingTasks(false);
        setTasks(data);
      })
      .catch((err) => {
        setLoadingTasks(false);
      });
  }, []);

  const fetchEvents = useCallback(() => {
    axiosInstance()
      .get('/event/my')
      .then(({ data: { data } }) => {
        setLoadingEvents(false);
        setEvents(data);
      })
      .catch((err) => {
        setLoadingEvents(false);
      });
  }, []);

  const fetchCases = useCallback(() => {
    axiosInstance()
      .get('/case/my')
      .then(({ data: { data } }) => {
        setLoadingCases(false);
        setCases(data);
      })
      .catch((err) => {
        setLoadingCases(false);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEvents();
    fetchCases();
  }, [fetchTasks, fetchEvents, fetchCases]);

  const dynamicChip = (data: string, type: string = null) => (
    <>
      <Typography
        className="flex items-center gap-[5px] text-[#6B6B6B] dark:text-[var(--dark-secondary-text)]"
        variant="body2"
        style={{ fontSize: 12 }}
      >
        <DateRange className="text-[#000] dark:text-white" style={{ fontSize: 12 }} />
        {type ? moment(data).format('MMM, DD HH:MM') : moment(data).format('MMM, DD YYYY')}
      </Typography>
    </>
  );

  return (
    <>
      {selectedActivity && (
        <ActivityModelHandler
          activityId={selectedActivity.id}
          setActivityData={setSelectedActivity}
          activityType={selectedActivity.type}
          onClose={() => {
            setSelectedActivity(null);
            if (searchData) {
              history.push('/reminder');
            }
          }}
          fetchBoard={() => {
            fetchTasks();
            fetchEvents();
            fetchCases();
          }}
        />
      )}
      <div className="main-container-v1">
        <div className="headerbox-v1">
          <CustomBreadCrumbs routes={[{ title: resources?.reminder?.titlePlural }]} />
        </div>
        <div className="detail-container-v1  min-h-[calc(100vh-99px)]">
          <div className=" grid h-[calc(100vh-172px)] gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <div className={`rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)]`}>
              <Box className="sticky top-0 z-10 rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)] px-[13px] py-[14px]">
                <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
                  Events
                </Typography>
              </Box>
              <Box>
                {events.map((event) => (
                  <Box
                    key={event._id}
                    className=" relative mx-[6px] mb-[14px] cursor-pointer rounded-[8px] bg-[var(--dark-primary,white)] px-[18px] py-[11px]"
                    style={{ cursor: 'pointer', boxShadow: '0px 3.5833494663238525px 26.8751220703125px rgba(0, 0, 0, 0.06)' }}
                    onClick={() => setSelectedActivity({ id: event._id, type: 'event' })}
                  >
                    <Typography
                      className=" mb-[8px] truncate"
                      variant="subtitle2"
                      style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.57, marginBottom: 8 }}
                    >
                      {event.name}
                    </Typography>
                    {dynamicChip(event?.startDate, 'event')}

                    <Typography
                      style={{
                        borderBottom: '1px solid var(--common-border-color)',
                        marginTop: 12,
                        marginBottom: 12,
                        paddingBottom: 12,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {event.description}
                    </Typography>
                    <Box mt={2}>
                      <ListRelatedTo relatedTo={event?.relatedTo} originRelatedTo={[]} />
                    </Box>
                  </Box>
                ))}
                <Box textAlign="center">
                  <Typography>{loadingEvents ? 'Loading...' : !events.length ? 'No Events' : null}</Typography>
                </Box>
              </Box>
            </div>
            <div className={`rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)]`}>
              <Box className="sticky top-0 z-10 rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)] px-[13px] py-[14px]">
                <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
                  Tasks
                </Typography>
              </Box>
              <Box>
                {tasks.map((task) => (
                  <Box
                    key={task._id}
                    className=" relative mx-[6px] mb-[14px] cursor-pointer rounded-[8px] bg-[var(--dark-primary,white)] px-[18px] py-[11px]"
                    style={{ cursor: 'pointer', boxShadow: '0px 3.5833494663238525px 26.8751220703125px rgba(0, 0, 0, 0.06)' }}
                    onClick={() => setSelectedActivity({ id: task._id, type: 'task' })}
                  >
                    <Typography
                      className=" mb-[8px] truncate"
                      variant="subtitle2"
                      style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.57, marginBottom: 8 }}
                    >
                      {task.name}
                    </Typography>
                    {dynamicChip(task?.dueDate)}

                    <Typography
                      style={{
                        borderBottom: '1px solid var(--common-border-color)',
                        marginTop: 12,
                        marginBottom: 12,
                        paddingBottom: 12,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {task.status}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {task.description}
                    </Typography>
                    <Box mt={2}>
                      <ListRelatedTo relatedTo={task?.relatedTo} originRelatedTo={[]} />
                    </Box>
                  </Box>
                ))}
                <Box textAlign="center">
                  <Typography>{loadingTasks ? 'Loading...' : !tasks.length ? 'No Tasks' : null}</Typography>
                </Box>
              </Box>
            </div>
            <div className={`rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)]`}>
              <Box className="sticky top-0 z-10 rounded-[8px] bg-[var(--dark-secondary,#f1f5ff)] px-[13px] py-[14px]">
                <Typography variant="subtitle2" style={{ width: '50%', fontSize: '0.95rem', fontWeight: 700 }} className=" capitalize">
                  Cases
                </Typography>
              </Box>
              <Box>
                {cases.map((cas) => (
                  <Box
                    key={cas._id}
                    className=" relative mx-[6px] mb-[14px] cursor-pointer rounded-[8px] bg-[var(--dark-primary,white)] px-[18px] py-[11px]"
                    style={{ cursor: 'pointer', boxShadow: '0px 3.5833494663238525px 26.8751220703125px rgba(0, 0, 0, 0.06)' }}
                    onClick={() => setSelectedActivity({ id: cas._id, type: 'case' })}
                  >
                    <Typography
                      className=" mb-[8px] truncate"
                      variant="subtitle2"
                      style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.57, marginBottom: 8 }}
                    >
                      {cas.name}
                    </Typography>

                    {dynamicChip(cas?.dueDate)}

                    <Typography
                      style={{
                        borderBottom: '1px solid var(--common-border-color)',
                        marginTop: 12,
                        marginBottom: 12,
                        paddingBottom: 12,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {cas.status}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                      {cas.description}
                    </Typography>
                    <Box mt={2}>
                      <ListRelatedTo relatedTo={cas?.relatedTo} originRelatedTo={[]} />
                    </Box>
                  </Box>
                ))}
                <Box textAlign="center">
                  <Typography>{loadingCases ? 'Loading...' : !cases.length ? 'No Cases' : null}</Typography>
                </Box>
              </Box>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reminder;

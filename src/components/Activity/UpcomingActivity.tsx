import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { displayDate } from '../../constants/helpers';
import { ListRelatedTo } from './Helpers/ListRelatedTo';
import axios, { CancelTokenSource } from 'axios';

const UpcomingActivity = (props) => {
  const { relatedTo } = props;
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchUpcomingActivity(cancelTokenSource);
    return () => cancelTokenSource.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUpcomingActivity = async (cancelTokenSource?: CancelTokenSource) => {
    axiosInstance()
      .get(`/activity/upcoming?relatedTo=${JSON.stringify(relatedTo)}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        setActivity(data);
      })
      .catch(() => { });
  };

  return (
    <Box border={1} p={1} borderColor="var(--common-border-color)">
      <Box ml={1} mb={1}>
        <Typography variant="h6">Upcoming Activity</Typography>
      </Box>
      {activity && (
        <Box>
          {activity.length ? (
            activity.map((_activity, index) => (
              <Box key={_activity._id} mb={1} border={1} p={1} borderColor="var(--common-border-color)">
                <Box>
                  <Grid container>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">{_activity.name}</Typography>
                    </Grid>
                    <Grid item xs={6} container justify="flex-end">
                      <Chip label={_activity.type} size="small" color="primary" />
                    </Grid>
                  </Grid>
                </Box>
                <Box pt={1}>
                  <Grid container>
                    <Grid item xs={6}>
                      <ListRelatedTo relatedTo={_activity.relatedTo} originRelatedTo={relatedTo} />
                    </Grid>
                    <Grid item xs={6} container justify="flex-end">
                      <Typography variant="caption"> {_activity.dueDate ? displayDate(_activity?.dueDate) : 'No Due Date'}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            ))
          ) : (
            <Box p={1} border={1} borderColor="var(--common-border-color)" textAlign="center">
              <Typography variant="subtitle2">No Past Activity</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default UpcomingActivity;

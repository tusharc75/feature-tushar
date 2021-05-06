import React, { useState, useEffect, Fragment } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { GetUpcomingActivity } from "../../axios/activity";
import Chip from '@material-ui/core/Chip';
import moment from "moment";
import { ListRelatedTo } from './Helpers/ListRelatedTo'


const UpcomingActivity = (props) => {

    const { relatedTo } = props;
    const [activity, setActivity] = useState(null);

    useEffect(() => {
        fetchUpcomingActivity();
    }, []);

    const fetchUpcomingActivity = async () => {
        await GetUpcomingActivity(JSON.stringify(relatedTo))
            .then(({ data }) => {
                setActivity(data)
            })
            .catch((err) => {
            });
    };


    return (<Box border={1} p={1} bgcolor="white" borderColor="grey.300">
        <Box ml={1} mb={1}>
            <Typography variant="h6">Upcoming Activity</Typography>
        </Box>
        {activity && <Box>
            {activity.length ?
                activity.map((_activity, index) => (
                    <Box key={_activity._id} mb={1} border={1} p={1} borderColor="grey.300">
                        <Box>
                            <Grid container>
                                <Grid item xs={6} >
                                    <Typography variant="subtitle2">{_activity.name}</Typography>
                                </Grid>
                                <Grid item xs={6} container justify="flex-end">
                                    <Chip label={_activity.type} size="small" color="primary" />
                                    {/* {_activity.status && <Chip label={_activity.status} size="small" color="default" />} */}
                                </Grid>
                            </Grid>
                        </Box>
                        <Box pt={1}>
                            <Grid container>
                                <Grid item xs={6} >
                                    <ListRelatedTo relatedTo={_activity.relatedTo} originRelatedTo={relatedTo} />
                                </Grid>
                                <Grid item xs={6} container justify="flex-end">
                                    <Typography variant="caption" > {_activity.dueDate ? moment(_activity.dueDate).format("MMM DD YYYY") : "No Due Date"}</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>))
                : <Box p={1} border={1} borderColor="grey.300" textAlign="center">
                    <Typography variant="subtitle2">No Past Activity</Typography>
                </Box>}
        </Box>}
    </Box>
    );
}

export default UpcomingActivity;

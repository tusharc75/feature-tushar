import React, { useState, useEffect } from "react";
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Layout from "../../components/Layout";
import Button from '@material-ui/core/Button';
import CustomTabs from "../../components/Helpers/CustomTabs";
import Board from "../../components/Activity/Report/Board";
import Roadmap from "../../components/Activity/Report/Roadmap";
import Calendar from "../../components/Activity/Report/Calendar";
import { SearchFilter } from "../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../components/Activity/ActivityModelHandler";
import { useParams, useHistory } from "react-router-dom";
import queryString from 'query-string';
import { GetReferenceName } from "../../axios/activity";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";

const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};


const Activity = () => {

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { referenceType, referenceId, activityType, activityId } = parsed;

    const { type } = useParams();
    const [viewType, setViewType] = useState(0);
    const [filter, setFilter] = useState([]);

    useEffect(() => {
        if (referenceType) {
            GetReferenceName(referenceType, referenceId)
                .then(({ data }) => {
                    setFilter([{ "_id": referenceId, "type": referenceType, "name": data.name }])
                })
                .catch((err) => {
                });
        }
    }, [referenceId]);

    const tabs = ["Board", "Roadmap", "Calendar"];
    const handleChangeFilter = (value) => {
        setFilter(value)
    }

    return (<Layout>
        <Grid container direction="row">
            <Grid item xs={12}>
                <CustomBreadCrumbs routes={[{ title: capitalize(type) }]} />
            </Grid>
        </Grid>
        <Box mt={2} p={2} pt={1} pl={1} bgcolor="white" >
            <Box mb={2}>
                <Grid container>
                    <Grid item xs={8}>
                        <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} />
                    </Grid>
                    <Grid xs={4} container justify="flex-end">
                        <CustomTabs value={viewType} setValue={setViewType} tabs={tabs} />
                    </Grid>
                </Grid>
            </Box>
            <Box mb={1}>
                {viewType === 0 && <Board type={type} filter={filter} activityId={activityId} />}
                {viewType === 1 && <Roadmap type={type} filter={filter} activityId={activityId} />}
                {viewType === 2 && <Calendar type={type} filter={filter} activityId={activityId} />}
            </Box>
        </Box>
        {activityType !== undefined && <ActivityModelHandler activityType={activityType} activityId={activityId} />}
    </Layout>
    );
}

export default Activity;

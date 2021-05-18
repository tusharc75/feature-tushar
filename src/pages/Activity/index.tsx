import { useState, useEffect } from "react";
import { Box, Grid, makeStyles } from "@material-ui/core";
import Layout from "../../components/Layout";
import CustomTabs from "../../components/Helpers/CustomTabs";
import Board from "../../components/Activity/Report/Board";
import Roadmap from "../../components/Activity/Report/Roadmap";
import Calendar from "../../components/Activity/Report/Calendar";
import { SearchFilter } from "../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../components/Activity/ActivityModelHandler";
import { useParams, useHistory } from "react-router-dom";
import queryString from "query-string";
import { GetReferenceName } from "../../axios/activity";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomContainer from "../../components/CustomContainer";

import _default from "yup/lib/locale";
const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const useStyles = makeStyles(() => ({
  activityContainer: {
    padding: "10px",
    height: "calc(100vh - 11.4rem)",
    overflow: "auto",
  },
}));

const Activity = () => {
  const classes = useStyles();
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
          setFilter([
            { _id: referenceId, type: referenceType, name: data.name },
          ]);
        })
        .catch((err) => {});
    }
  }, [type, referenceId]);

  const tabs = ["Board", "Roadmap"];
  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  return (
    <Layout>
      <Grid container direction="row">
        <Grid item xs={12}>
          <CustomBreadCrumbs
            routes={[
              { title: "Activity", path: "/activity" },
              { title: capitalize(type) },
            ]}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <Box>
          <Grid container>
            <Grid item xs={8}>
              <Box m={1}>
                <SearchFilter
                  handleChangeFilter={handleChangeFilter}
                  filter={filter}
                />
              </Box>
            </Grid>
            <Grid item xs={4}>
              <CustomTabs value={viewType} setValue={setViewType} tabs={tabs} />
            </Grid>
          </Grid>
        </Box>
        <Box className={classes.activityContainer}>
          {viewType === 0 && (
            <Board type={type} filter={filter} activityId={activityId} />
          )}
          {viewType === 1 && (
            <Roadmap type={type} filter={filter} activityId={activityId} />
          )}
        </Box>
      </CustomContainer>
      {activityType !== undefined && (
        <ActivityModelHandler
          activityType={activityType}
          activityId={activityId}
        />
      )}
    </Layout>
  );
};

export default Activity;

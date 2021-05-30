import { useState, useEffect } from "react";
import { Box, Grid, makeStyles, Paper } from "@material-ui/core";
import Layout from "../../components/Layout";
import CustomTabs from "../../components/Helpers/CustomTabs";
import Board from "../../components/Activity/Report/Board";
import Roadmap from "../../components/Activity/Report/Roadmap";
import { SearchFilter } from "../../components/Activity/Report/SearchFilter";
import ActivityModelHandler from "../../components/Activity/ActivityModelHandler";
import { useParams, useHistory } from "react-router-dom";
import queryString from "query-string";
import { GetReferenceName } from "../../axios/activity";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CustomContainer from "../../components/CustomContainer";

import "./style.scss";

import _default from "yup/lib/locale";
const capitalize = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const useStyles = makeStyles((theme) => ({
  activityContainer: {
    padding: "0 10px 10px",
  },
  activityHeader: {
    background: "#dfdfdf",
    margin: "6px 6px",
    borderRadius: "6px",
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
        .catch((err) => { });
    }
  }, [type, referenceId]);

  const tabs = ["Board", "Roadmap"];
  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  return (
    <Layout>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: capitalize(type) }]} />
        </Grid>
        <CustomContainer styles={{ width: "100%" }}>
          <Box className={classes.activityHeader}>
            <Paper elevation={4} style={{ marginBottom: 20 }}>
              <Grid container>
                <Grid item xs={12} md={5} sm={7}>
                  <Box display="flex" justifyContent="center">
                    <CustomTabs
                      value={viewType}
                      setValue={setViewType}
                      tabs={tabs}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={7} sm={5}>
                  <SearchFilter
                    handleChangeFilter={handleChangeFilter}
                    filter={filter}
                    ActivityName={type === "case" ? "Case" : ""}
                  />
                </Grid>
              </Grid>
            </Paper>
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
      </Grid>
    </Layout>
  );
};

export default Activity;

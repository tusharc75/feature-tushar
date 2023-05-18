import { useState, useEffect, Fragment } from 'react';
import { Box, Grid, makeStyles, Paper } from '@material-ui/core';
import CustomTabs from '../../components/Helpers/CustomTabs';
import Board from '../../components/Activity/Report/Board';
import Roadmap from '../../components/Activity/Report/Roadmap';
import { SearchFilter } from '../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName } from '../../axios/activity';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import { useData } from '../../StateProvider/Provider';
import './style.scss';
import { isMobile } from 'react-device-detect';

const capitalize = (string) => {
  return string?.charAt(0)?.toUpperCase() + string?.slice(1);
};

const useStyles = makeStyles((theme) => ({
  activityContainer: {
    padding: '0 10px 10px'
  },
  activityHeader: {
    margin: '6px 6px',
    borderRadius: '6px',
    '& .MuiGrid-spacing-xs-1': {
      width: 'calc(100% + 14px)'
    }
  }
}));

const Activity = ({ type }) => {
  const classes = useStyles();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();
  const [viewType, setViewType] = useState(0);
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {});
    } else {
      setFilter([]);
    }
  }, [type, referenceId]);

  const tabs = ['Board', 'Roadmap'];
  const handleChangeFilter = (value) => {
    setFilter(value);
    history.replace({
      search: ''
    });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item xs={12}>
          <CustomBreadCrumbs routes={[{ title: capitalize(routes[type].title) }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        {filter && (
          <Fragment>
            <Box className={classes.activityHeader}>
              <Box style={{ marginBottom: 20 }}>
                <Grid container>
                  <Grid item xs={12} md={5} sm={7}>
                    <Box display="flex" justifyContent="center">
                      <CustomTabs value={viewType} setValue={setViewType} tabs={tabs} />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={7} sm={5}>
                    <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} activityName={type} />
                  </Grid>
                </Grid>
              </Box>
            </Box>
            <Box className={classes.activityContainer}>
              {viewType === 0 && <Board type={type} filter={filter} />}
              {viewType === 1 && <Roadmap type={type} filter={filter} />}
            </Box>
          </Fragment>
        )}
      </CustomContainer>
    </Fragment>
  );
};

export default Activity;

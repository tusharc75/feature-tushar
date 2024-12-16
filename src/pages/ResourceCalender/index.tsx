import { Grid, Typography, Box, Container } from '@material-ui/core';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { RESOURCE_CALENDAR } from './../../constants/helpers';
import { MdDescription } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';

const ResourceCalendar = () => {
  const {
    state: { permissions, resources }
  } = useData();

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ ...routes.resourceCalendar, title: resources?.resourceCalendar?.titlePlural }]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} className="d-flex align-items-center gap-1 layout-for-tablet">
              <Grid style={{ display: 'flex', justifyContent: 'center' }}>
                <MdDescription size={22} className="headerLogo" />
                <span className="listingHeader">Resource Calendar</span>
              </Grid>
            </Grid>
          </Grid>
        </div>
        <Container maxWidth="lg">
          <Box p={3}>
            <Grid container spacing={2}>
              {RESOURCE_CALENDAR.map((resource: any) => {
                return (
                  permissions[resource.key]?.isRead && (
                    <Grid key={resource.key} item xs={12} sm={2} md={3} lg={4}>
                      <Link to={`/resource-calendar${routes[resource.key]?.path}`}>
                        <Box border={1} borderColor="var(--common-border-color)" borderRadius={1} p={2}>
                          <Typography variant="h6">
                            <MdDescription size={25} className="headerLogo mr-2 pt-1" />
                            {resource.title}
                          </Typography>
                        </Box>
                      </Link>
                    </Grid>
                  )
                );
              })}
            </Grid>
          </Box>
        </Container>
      </div>
    </div>
  );
};

export default ResourceCalendar;

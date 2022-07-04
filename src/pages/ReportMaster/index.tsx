import { Grid, Typography, Box, Container, Button } from '@material-ui/core';
import styles from '../Leads/Header.module.scss';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { REPORT_LIST } from './../../constants/helpers';
import { MdDescription } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { kebabCase } from 'lodash';
import { useData } from '../../StateProvider/Provider';
import { AiFillCalendar } from 'react-icons/ai';

const ReportMaster = () => {
  const {
    state: { permissions }
  } = useData();

  return (
    <div>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '' }]} />
        </Grid>
      </Grid>
      <div className="main-container">
        <div className="header-panel">
          <Grid container>
            <Grid item xs={4} sm={6}>
              <Box display="flex" alignItems="center">
                <MdDescription size={22} className="headerLogo" />
                <span className="listingHeader">Reports</span>
              </Box>
            </Grid>
            <Grid item xs={8} sm={6}>
              <Box display="flex" alignItems="center" justifyContent="flex-end">
                <Link to={`/schedule-report`}>
                  <Button variant="outlined" size="small" endIcon={<AiFillCalendar />} color="primary">
                    Schedule Report
                  </Button>
                </Link>
              </Box>
            </Grid>
          </Grid>
        </div>
        <hr />
        <Container maxWidth="lg">
          <Box p={3}>
            <Grid container spacing={2}>
              {REPORT_LIST.map((report: any, index: any) => {
                return (
                  permissions[report.permission]?.isRead && (
                    <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                      <Link
                        to={`/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`}
                      >
                        <Box border={1} borderColor="grey.300" bgcolor="grey.100" borderRadius={1} p={2}>
                          <Typography variant="h6">
                            <MdDescription size={25} className="headerLogo mr-2 pt-1" />
                            {report.title}
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

export default ReportMaster;

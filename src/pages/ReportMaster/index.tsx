import { Grid, Typography, Box, Container, Button, Divider } from '@material-ui/core';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { REPORT_LIST } from './../../constants/helpers';
import { MdDescription } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { kebabCase } from 'lodash';
import { useData } from '../../StateProvider/Provider';
import { AiFillCalendar } from 'react-icons/ai';
import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import styles from './index.module.scss';
import { ReportIcon } from 'src/assets/svg/svgIcons';
import { HiArrowRight } from 'react-icons/hi';

const colorPalette = [
  { iconsColor: ['#059825', '#059825 ', '#60D778'], color: '#F9FDEC' },
  { iconsColor: ['#D51E1E', '#D51E1E', '#FD6E6E'], color: '#FFEFEE' },
  { iconsColor: ['#577BFC', '#1608BD', '#ABB6EF'], color: '#F3F8FF' },
  { iconsColor: ['#FAC94B', '#FF9B04', '#FFDDA6'], color: '#FFFAEC' },
  { iconsColor: ['#AD14F5', '#6203AC', '#BE74E5'], color: '#F6F1FF' },
  { iconsColor: ['#FFA800', '#E35200', '#FBC56E'], color: '#EBEBEB' },
  { iconsColor: ['#059825', '#059825', '#60D778'], color: '#F9FDEC' },
  { iconsColor: ['#D51E1E', '#D51E1E', '#FD6E6E'], color: '#FFEFEE' },
  { iconsColor: ['#FAC94B', '#FF9B04', '#FFDDA6 '], color: '#FFFAEC' },
  { iconsColor: ['#059825', '#059825', '#60D778'], color: '#F9FDEC' },
  { iconsColor: ['#D51E1E', '#D51E1E', '#FD6E6E'], color: '#FFEFEE' },
  { iconsColor: ['#577BFC', '#1608BD', '#ABB6EF'], color: '#F3F8FF' }
];

const ReportMaster = () => {
  const {
    state: { permissions }
  } = useData();
  const [customReports, setCustomReports] = useState([]);

  useEffect(() => {
    (async () => {
      let {
        data: { data }
      } = await axiosInstance().get(`custom-report`);
      setCustomReports(data);
    })();
  }, []);

  return (
    <div className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '' }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Link to="/custom-report">
              <Button className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                Custom Report
              </Button>
            </Link>
            {permissions?.scheduleReport?.isRead && (
              <Link to={`/schedule-report`}>
                <Button className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                  Schedule Report
                </Button>
              </Link>
            )}
          </Box>
        </Box>
      </Box>
      <div className="detail-container-v1">
        <Box className={styles.reportGrid}>
          {REPORT_LIST.map((report: any, index: any) => {
            return (
              permissions[report.permission]?.isRead && (
                <Box key={index} className={styles.singleCard}>
                  <Link
                    to={`/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`}
                  >
                    <Box className={styles.cardInner} style={{ backgroundColor: report.color }}>
                      <ReportIcon colors={report.iconsColor} className={styles.floatIcon} />
                      <Typography variant="h6">{report.type === 'dynamic' ? routes[report.key]?.title : report.title}</Typography>
                      <Typography variant="body2">{report.text}</Typography>
                      <Link
                        to={`/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`}
                      >
                        View All <HiArrowRight className={styles.arrow} />
                      </Link>
                    </Box>
                  </Link>
                </Box>
              )
            );
          })}
        </Box>
        {customReports?.length ? (
          <Box mt={3}>
            <Typography variant="h6">Custom Reports</Typography>
            <Box mt={2}>
              <Box className={styles.reportGrid}>
                {customReports?.map((item, index) => {
                  let accessor = index % colorPalette.length;
                  return (
                    <Box key={index} className={styles.singleCard}>
                      <Link to={`/reports/custom-report/${item._id}`}>
                        <Box className={styles.cardInner} style={{ backgroundColor: colorPalette[accessor].color }}>
                          <ReportIcon colors={colorPalette[accessor].iconsColor} className={styles.floatIcon} />
                          <Typography variant="h6">{item.customReportName}</Typography>
                          <Typography variant="body2" className={styles.withoutDetails}></Typography>
                          <Link to={`/reports/custom-report/${item._id}`}>
                            View All <HiArrowRight className={styles.arrow} />
                          </Link>
                        </Box>
                      </Link>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        ) : null}
      </div>
    </div>
  );
};

export default ReportMaster;

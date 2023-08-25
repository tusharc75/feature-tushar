import { Grid, Typography, Box, Container, Button, Divider } from '@material-ui/core';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import { REPORT_LIST } from './../../constants/helpers';
import { MdDescription } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { kebabCase } from 'lodash';
import { useData } from '../../StateProvider/Provider';
import { AiFillCalendar } from 'react-icons/ai';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import styles from './index.module.scss';
import { ReportIcon } from 'src/assets/svg/svgIcons';
import { HiArrowRight } from 'react-icons/hi';
import { getColors } from '../Home/helpers';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import SearchBox from 'src/components/Helpers/SearchBox';
import { debounce } from 'lodash';

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

type TReportFromHelper = {
  title: string;
  permission: string;
  key: string;
  type: string;
};

export type TReportsFromAPI = {
  _id?: string;
  brand?: string;
  customReportName?: string;
};

const ReportMaster = () => {
  const {
    state: { permissions }
  } = useData();
  const [customReports, setCustomReports] = useState<TReportsFromAPI[]>([]);
  const [filteredCustomReports, setFilteredCustomReports] = useState<TReportsFromAPI[]>([]);

  const [reportList, setReportList] = useState<TReportFromHelper[]>(REPORT_LIST);
  const [searchedValue, setSearchedValue] = useState('');

  useEffect(() => {
    (async () => {
      let {
        data: { data }
      } = await axiosInstance().get(`custom-report`);
      setCustomReports(data);
      setFilteredCustomReports(data);
    })();
  }, []);

  const filterValues = useCallback(
    debounce((searchedValue: string) => {
      const searchedFor = searchedValue.toLowerCase().trim();
      if (!searchedFor && searchedFor === '') {
        setReportList(REPORT_LIST);
        customReports.length && setFilteredCustomReports(customReports);
        return;
      }
      setReportList(() => REPORT_LIST.filter((f) => f.title.toLowerCase().includes(searchedFor)));
      setFilteredCustomReports((prev) => prev.filter((f) => f.customReportName.toLowerCase().includes(searchedFor)));
      return;
    }, 400),
    []
  );

  useEffect(() => {
    filterValues(searchedValue);
  }, [searchedValue, filterValues]);

  return (
    <div className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ title: 'Reports', path: '' }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <Link to="/custom-report">
              <Button variant="outlined" className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                Custom Report
              </Button>
            </Link>
            {permissions?.scheduleReport?.isRead && (
              <Link to={`/schedule-report`}>
                <Button variant="outlined" className="btn-outline-v1" size="small" endIcon={<AiFillCalendar />}>
                  Schedule Report
                </Button>
              </Link>
            )}
          </Box>
        </Box>
      </Box>
      <div className="detail-container-v1">
        <div className="flex justify-end mb-4">
          <SearchBox onChange={(e) => setSearchedValue(e.target.value)} value={searchedValue} />
        </div>
        {reportList.length ? (
          <Box className={styles.reportGrid}>
            <>
              {reportList.map((report: any, index: any) => {
                const colors = getColors(index);
                return (
                  permissions[report.permission]?.isRead && (
                    <div key={index} className={styles.singleCard}>
                      <Link
                        to={`/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`}
                      >
                        <DashBoardCardShell
                          darkThemeBackgroundColor="var(--dark-secondary)"
                          background={'#fff'}
                          gradientColors={colors.gradient}
                          className={styles.cardInner}
                          minHeight={false}
                        >
                          <ReportIcon colors={colors.iconGradient} className={styles.floatIcon} />
                          <Typography variant="h6">{report.type === 'dynamic' ? routes[report.key]?.title : report.title}</Typography>
                          <Typography variant="body2">{/* {report.text} */}</Typography>
                          <Link
                            to={`/reports${
                              report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path
                            }`}
                          >
                            View <HiArrowRight className={styles.arrow} />
                          </Link>
                        </DashBoardCardShell>
                      </Link>
                    </div>
                  )
                );
              })}
            </>
          </Box>
        ) : (
          <div className="text-[16px] font-semibold text-gray-400 dark:text-gray-300 p-12  text-center">No Reports Found</div>
        )}

        <Box mt={3}>
          <Typography variant="h6">Custom Reports</Typography>
          <Box mt={2}>
            {filteredCustomReports?.length ? (
              <Box className={styles.reportGrid}>
                {filteredCustomReports?.map((item, index) => {
                  const colors = getColors(index);
                  return (
                    <Box key={index} className={styles.singleCard}>
                      <Link to={`/reports/custom-report/${item._id}`}>
                        <DashBoardCardShell
                          darkThemeBackgroundColor="var(--dark-secondary)"
                          background={'#fff'}
                          gradientColors={colors.gradient}
                          className={styles.cardInner}
                          minHeight={false}
                        >
                          <ReportIcon colors={colors.iconGradient} className={styles.floatIcon} />
                          <Typography variant="h6">{item.customReportName}</Typography>
                          <Typography variant="body2" className={styles.withoutDetails}>
                            {' '}
                            {/* */}
                          </Typography>
                          <Link to={`/reports/custom-report/${item._id}`}>
                            View
                            <HiArrowRight className={styles.arrow} />
                          </Link>
                        </DashBoardCardShell>
                      </Link>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <div className="text-[16px] font-semibold text-gray-400 dark:text-gray-300 p-12 border-t border-dashed border-r-0 border-l-0 border-b-0 text-center">
                No Custom Reports Found
              </div>
            )}
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default ReportMaster;

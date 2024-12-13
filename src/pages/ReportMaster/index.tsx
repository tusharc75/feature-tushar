import { Box, Button, Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { AiFillCalendar } from 'react-icons/ai';
import { HiArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { ReportIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import SearchBox from 'src/components/Helpers/SearchBox';
import { useData } from '../../StateProvider/Provider';
import { getColors } from '../Home/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { REPORT_LIST } from './../../constants/helpers';
import styles from './index.module.scss';
import { useStore, SEARCH } from 'src/StateProvider/fastContext';

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
  const [searchQuery] = useStore((store) => store[SEARCH]);
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
    (searchedValue: string) => {
      const searchedFor = searchedValue.toLowerCase().trim();
      if (!searchedFor && searchedFor === '') {
        setReportList(REPORT_LIST);
        customReports.length && setFilteredCustomReports(customReports);
        return;
      }
      setReportList(() => REPORT_LIST.filter((f) => f.title.toLowerCase().includes(searchedFor)));
      setFilteredCustomReports((prev) => prev.filter((f) => f.customReportName.toLowerCase().includes(searchedFor)));
    },
    [customReports]
  );

  useEffect(() => {
    filterValues(searchQuery);
  }, [searchQuery, filterValues]);

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
        <div className="mb-4 flex justify-end">
          <SearchBox
            onChange={(e) => {
              const value = e.target.value;
              filterValues(value);
              setSearchedValue(value);
            }}
            value={searchedValue}
          />
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
                            to={`/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path
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
          <div className="p-12 text-center text-[16px] font-semibold text-gray-400  dark:text-gray-300">No Reports Found</div>
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
              <div className="border-b-0 border-l-0 border-r-0 border-t border-dashed p-12 text-center text-[16px] font-semibold text-gray-400 dark:text-gray-300">
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

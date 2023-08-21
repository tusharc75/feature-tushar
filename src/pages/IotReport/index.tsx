import { Box, Typography } from '@material-ui/core';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { IOT_REPORT_LIST } from './../../constants/helpers';
import { getColors } from '../Home/helpers';
import styles from './index.module.scss';
import { ReportIcon } from 'src/assets/svg/svgIcons';
import { HiArrowRight } from 'react-icons/hi';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import { Link } from 'react-router-dom';

function IotReportList() {
    return (
        <div className="main-container-v1">
            <Box className="headerbox-v1">
                <Box className="nav-v1">
                    <CustomBreadCrumbs routes={[routes.iotReport]} />
                </Box>
            </Box>
            <div className="detail-container-v1">
                <Box className={styles.reportGrid}>
                    {IOT_REPORT_LIST.map((report: any, index: any) => {
                        const colors = getColors(index);
                        return (

                            <div key={index} className={styles.singleCard}>
                                <Link
                                    to={`/iot-report${routes[report.key]?.path}`}
                                >
                                    <DashBoardCardShell
                                        darkThemeBackgroundColor="var(--dark-secondary)"
                                        background={'#fff'}
                                        gradientColors={colors.gradient}
                                        className={styles.cardInner}
                                        minHeight={false}
                                    >
                                        <ReportIcon colors={colors.iconGradient} className={styles.floatIcon} />
                                        <Typography variant="h6">{report.title}</Typography>
                                        <Typography variant="body2">{/* {report.text} */}</Typography>
                                        <Link
                                            to={`/iot-report${routes[report.key]?.path}`}
                                        >
                                            View <HiArrowRight className={styles.arrow} />
                                        </Link>
                                    </DashBoardCardShell>
                                </Link>
                            </div>
                        );
                    })}
                </Box>
            </div>
        </div>
    )
}

export default IotReportList;
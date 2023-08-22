import { Box, Grid, Typography } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import styles from '../Leads/Header.module.scss';
import cardStyle from '../ReportMaster/index.module.scss';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { Link } from 'react-router-dom';
import { serializedAsset } from '../../constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import SearchBox from 'src/components/Helpers/SearchBox';
import { isMobile } from 'react-device-detect';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

function IotChart() {

  const toastConfig = useContext(CustomToastContext);

  const [rowsData, setRowsData] = useState([])
  const [search, setSearch] = useState()

  useEffect(() => {
    fetchProductInventory()
  }, [search])

  const fetchProductInventory = () => {
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        setRowsData(data.data)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    let deepFilter = `?page=${0}&limit=${100}`;
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleSearch = (e) => {
    setSearch(e.target.value)
  };

  return (
    <div className="main-container-v1">
      <Grid container className="headerbox-v1">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.iotChart]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}></Grid>
            <Grid md={6} sm={12} xs={12} container className={styles.filter_side}>
              <Box className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid>
                  <SearchBox
                    onChange={handleSearch}
                    className={styles.search_box_input}
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                    size="small"
                    value={search}
                  />
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>
        <Box className={cardStyle.reportGrid}>
          {
            rowsData?.map((asset, i) => {
              return (
                <div key={i} className={cardStyle.singleCard}>
                  <Link
                    to={`${routes.iotChart.path}/${asset?._id}`}
                  >
                    <DashBoardCardShell
                      darkThemeBackgroundColor="var(--dark-secondary)"
                      background={'#fff'}
                      gradientColors={['#FC5757', '#C60707']}
                      className={cardStyle.cardInner}
                      minHeight={false}
                    >
                      <Typography variant="h6">{asset?.assetNumber}</Typography>
                      <Typography variant="body2">{asset?.currentLocation?.optionLabel}</Typography>
                    </DashBoardCardShell>
                  </Link>
                </div>
              )
            })
          }
        </Box>
      </CustomContainer>
    </div>
  )
}

export default IotChart;

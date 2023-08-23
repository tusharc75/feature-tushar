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
import { getColors } from '../Home/helpers';
import { DataPointsIcon } from 'src/assets/svg/svgIcons';

function IotChart() {
  const toastConfig = useContext(CustomToastContext);

  const [rowsData, setRowsData] = useState([]);
  const [search, setSearch] = useState();

  useEffect(() => {
    fetchProductInventory();
  }, [search]);

  const fetchProductInventory = () => {
    const queryString = getQueryString();
    axiosInstance()
      .get(`${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        setRowsData(data.data);
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
    setSearch(e.target.value);
  };

  return (
    <div className="main-container-v1">
      <Grid container className="headerbox-v1">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.iotChart]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="flex justify-end mb-3">
          <SearchBox onChange={handleSearch} size="small" value={search} className="flex-grow md:flex-grow-0" />
        </div>
        <Box className={cardStyle.reportGrid}>
          {rowsData?.map((asset, i) => {
            const colors = getColors(i);
            return (
              <div key={i} className={cardStyle.singleCard}>
                <Link to={`${routes.iotChart.path}/${asset?._id}`}>
                  <DashBoardCardShell
                    darkThemeBackgroundColor="var(--dark-secondary)"
                    background={'#fff'}
                    gradientColors={colors.gradient}
                    className={cardStyle.cardInner}
                    minHeight={false}
                  >
                    <DataPointsIcon colors={colors.iconGradient} className={`absolute -top-[23px] left-[18px]`} />
                    <Typography variant="h6">{asset?.assetNumber}</Typography>
                    <Typography variant="body2">{asset?.currentLocation?.optionLabel}</Typography>
                  </DashBoardCardShell>
                </Link>
              </div>
            );
          })}
        </Box>
      </CustomContainer>
    </div>
  );
}

export default IotChart;

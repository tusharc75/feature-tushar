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
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { getColors } from '../Home/helpers';
import { DataPointsIcon } from 'src/assets/svg/svgIcons';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import MyLocationIcon from '@material-ui/icons/MyLocation';

function IotChart() {
  const toastConfig = useContext(CustomToastContext);

  const [rowsData, setRowsData] = useState(null);
  const [assetLocation, setAssetLocation] = useState(null);
  const [search, setSearch] = useState();
  const [showAsset, setShowAsset] = useState(null);

  useEffect(() => {
    fetchAssetLocation();
  }, []);

  useEffect(() => {
    if (showAsset) {
      fetchData();
    }
  }, [search, showAsset]);

  const fetchData = () => {
    const queryString = getQueryString();
    axiosInstance()
      .get(`/iot-chart${serializedAsset.api}${queryString}`)
      .then(({ data }) => {
        setRowsData(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchAssetLocation = () => {
    axiosInstance()
      .get(`/iot-chart${serializedAsset.api}-location`)
      .then(({ data }) => {
        setAssetLocation(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getQueryString = () => {
    const filterByIds = [];
    let deepFilter = `?page=${0}&limit=${100}`;
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    if (showAsset) {
      filterByIds.push({
        field: 'currentLocation',
        term: showAsset
      });
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }

    return `${deepFilter}&filterType=and&filterByIdType=and`;
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const colours: any = [
    {
      main: '#FFEFEE',
      icon: ['#FC5757', '#C60707'],
      iconGradient: ['#FC5757', '#C60707', '#FC5757'],
      gradient: ['#FC5757', '#C60707']
    },
    {
      main: '#F3F8FF',
      icon: ['#68C82E', '#03640D'],
      iconGradient: ['#68C82E', '#03640D', '#68C82E'],
      gradient: ['#68C82E', '#03640D']
    },
    {
      main: '#FFFAEC',
      icon: ['#FAC94B', '#FF9B04'],
      iconGradient: ['#FAC94B', '#FF9B04', '#FAC94B'],
      gradient: ['#FAC94B', '#FF9B04']
    }
  ];

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.iotChart]} />
      </div>
      <CustomContainer>
        {!showAsset ? (
          assetLocation ? (
            <Box className={cardStyle.reportGrid}>
              {assetLocation?.map((location) => {
                return (
                  <div key={location?._id} className={cardStyle.singleCard}>
                    <DashBoardCardShell
                      darkThemeBackgroundColor="var(--dark-secondary)"
                      background={'#fff'}
                      className={cardStyle.cardInner}
                      minHeight={false}
                      onClick={() => {
                        setShowAsset(location?._id);
                      }}
                    >
                      <MyLocationIcon className={`absolute -top-[10px] left-[18px]`} />
                      <Typography variant="h6">{location?.currentLocation}</Typography>
                    </DashBoardCardShell>
                  </div>
                );
              })}
            </Box>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )
        ) : (
          <>
            <div className="flex justify-end mb-3">
              <SearchBox onChange={handleSearch} size="small" value={search} className="flex-grow md:flex-grow-0" />
            </div>
            {rowsData ? (
              <Box className={cardStyle.reportGrid}>
                {rowsData?.map((asset, i) => {
                  var colors = colours[0];
                  if (asset?.runningStatus) {
                    colors = colours[1];
                  }
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
            ) : (
              <Box p={2} height={500}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Box>
            )}
          </>
        )}
      </CustomContainer>
    </div>
  );
}

export default IotChart;

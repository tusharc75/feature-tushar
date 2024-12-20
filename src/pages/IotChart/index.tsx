import { Box, Button, Chip, Typography } from '@material-ui/core';
import MyLocationIcon from '@material-ui/icons/MyLocation';
import { useContext, useEffect, useState } from 'react';
import { MdChevronLeft } from 'react-icons/md';
import { Link, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { DataPointsIcon } from 'src/assets/svg/svgIcons';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import DashBoardCardShell from 'src/components/DashBoardCardShell';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';
import { serializedAsset } from '../../constants/helpers';
import cardStyle from './index.module.scss';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { uniqBy } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

function IotChart() {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  let { referenceData }: any = queryString.parse(history.location.search);

  const {
    state: { resources }
  }: any = useData();

  const [assetLocation, setAssetLocation] = useState(null);
  const [search, setSearch] = useState('');
  const [showAsset, setShowAsset] = useState(null);
  const [showLocation, setShowLocation] = useState(null);

  useEffect(() => {
    fetchAssetLocation();
  }, [search]);

  const fetchAssetLocation = () => {
    let api = `/iot-chart${serializedAsset.api}-location`;
    if (search) {
      api = `${api}?search=${encodeURIComponent(search)}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data }) => {
        setAssetLocation(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  useEffect(() => {
    if (referenceData && assetLocation) {
      setShowLocation(assetLocation?.find((a) => a?._id === referenceData)?.region?.optionValue);
      setShowAsset(referenceData);
    }
  }, [referenceData, assetLocation]);

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
    }
  ];

  const LeftSideContent = () => {
    return showLocation || showAsset ? (
      <Button
        size="small"
        variant="outlined"
        color="primary"
        disableElevation
        onClick={() => {
          setShowAsset(null);
          if (!showAsset) {
            setShowLocation(null);
          }
          setSearch('');
        }}
        startIcon={<MdChevronLeft />}
      >
        Go Back
      </Button>
    ) : null;
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.iotChart, title: resources?.iotChart?.titlePlural }]} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          leftSideContents={<LeftSideContent />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
        />
        {assetLocation ? (
          assetLocation?.length > 0 ? (
            !showLocation && !showAsset ? (
              uniqBy(assetLocation, 'region.optionValue')?.filter((r: any) => !!r?.region)?.length ? (
                <Box className={cardStyle.reportGrid}>
                  {uniqBy(assetLocation, 'region.optionValue')
                    ?.filter((r: any) => !!r?.region)
                    ?.map((region: any) => {
                      return (
                        <div key={region?.region?.optionValue} className={cardStyle.singleCard}>
                          <DashBoardCardShell
                            darkThemeBackgroundColor="var(--dark-secondary)"
                            background={'#fff'}
                            className={cardStyle.cardInner}
                            gradientColors={
                              assetLocation?.some(
                                (a) => a?.region?.optionValue === region?.region?.optionValue && a?.assets?.some((asset) => asset?.redAlert)
                              )
                                ? colours[0]?.gradient
                                : colours[1]?.gradient
                            }
                            minHeight={false}
                            onClick={() => {
                              setShowLocation(region?.region?.optionValue);
                              setSearch('');
                            }}
                          >
                            <MyLocationIcon className={`absolute -top-[10px] left-[18px]`} />
                            <Chip label="Region" color="primary" className={`absolute -top-[-10px] right-[10px]`} />
                            <Typography variant="h6">{region?.region?.optionLabel}</Typography>
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
            ) : showLocation && !showAsset ? (
              <Box className={cardStyle.reportGrid}>
                {assetLocation
                  ?.filter((location) => location?.region?.optionValue === showLocation)
                  ?.map((location) => {
                    return (
                      <div key={location?._id} className={cardStyle.singleCard}>
                        <DashBoardCardShell
                          darkThemeBackgroundColor="var(--dark-secondary)"
                          background={'#fff'}
                          className={cardStyle.cardInner}
                          gradientColors={location?.assets?.some((asset) => asset?.redAlert) ? colours[0]?.gradient : colours[1]?.gradient}
                          minHeight={false}
                          onClick={() => {
                            setShowAsset(location?._id);
                            setSearch('');
                          }}
                        >
                          <MyLocationIcon className={`absolute -top-[10px] left-[18px]`} />
                          <Chip label="Location" color="primary" className={`absolute -top-[-10px] right-[10px]`} />
                          <Typography variant="h6">{location?.currentLocation}</Typography>
                        </DashBoardCardShell>
                      </div>
                    );
                  })}
              </Box>
            ) : showAsset ? (
              assetLocation?.find((a) => a?._id === showAsset)?.assets?.length ? (
                <Box className={cardStyle.reportGrid}>
                  {assetLocation
                    ?.find((a) => a?._id === showAsset)
                    ?.assets?.map((asset, i) => {
                      return (
                        <div key={i} className={cardStyle.singleCard}>
                          <Link to={`${routes.iotChartDetail.path}/${asset?.optionValue}`}>
                            <DashBoardCardShell
                              darkThemeBackgroundColor="var(--dark-secondary)"
                              background={'#fff'}
                              gradientColors={asset?.redAlert ? colours[0]?.gradient : colours[1]?.gradient}
                              className={cardStyle.cardInner}
                              minHeight={false}
                            >
                              <DataPointsIcon
                                colors={asset?.redAlert ? colours[0]?.iconGradient : colours[1]?.iconGradient}
                                className={`absolute -top-[23px] left-[18px]`}
                              />
                              <Chip label="Unit" color="primary" className={`absolute -top-[-10px] right-[10px]`} />
                              <Typography variant="h6">{asset?.optionLabel}</Typography>
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
              )
            ) : null
          ) : (
            <span>{'No Data Found'}</span>
          )
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </div>
  );
}

export default IotChart;

import { Box, IconButton } from "@mui/material";
import axios, { CancelTokenSource } from "axios";
import { camelCase } from "lodash";
import { useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import CustomBreadCrumbs from "src/components/CustomBreadCrumbs";
import CustomContainer from "src/components/CustomContainer";
import { useTableReducer } from "src/components/CustomReactTable";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import routes from "src/components/Helpers/Routes";
import IconButtonTabs from "src/components/IconButtonTabs";
import { ListingPageHeader } from "src/components/PageHeaders";
import { prepareDataForGrid, sidebarResource, wellMaster } from "src/constants/helpers";
import CardView from "src/pages/OperatorView/CardView";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import { useData } from "src/StateProvider/Provider";
import RefreshIcon from "@mui/icons-material/Refresh";
import { IoAppsSharp } from "react-icons/io5";
import { IoMapSharp } from "react-icons/io5";
import { useParams, useLocation, useHistory } from 'react-router-dom'
import MapView from "src/pages/OperatorView/MapView";

const OperatorView = () => {
  const {
    state: { resources }
  }: any = useData();

  const location = useLocation();
  const history = useHistory();

  const { padId, wellId } = useParams();
  const { padName, wellName } = location.state || {};

  const renderedFrom = camelCase(sidebarResource.operatorView);

  const toastConfig = useContext(CustomToastContext);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, search } = state;

  const [view, setView] = useState('card')
  const [loading, setLoading] = useState(false)

  const resource = useMemo(() => {
    if (wellId) {
      return sidebarResource.serializedAsset
    } else if (padId) {
      return sidebarResource?.wellMaster
    }
    return sidebarResource?.padMaster
  }, [padId, wellId])

  const breadCrumbs = useMemo(() => {
    if (resource === sidebarResource?.wellMaster) {
      return [{ ...routes?.operatorView, title: resources?.operatorView?.titlePlural }, { title: padName }]
    } else if (resource === sidebarResource?.serializedAsset) {
      return [{ ...routes?.operatorView, title: resources?.operatorView?.titlePlural }, { path: `${routes?.operatorView?.path}/${padId}`, title: padName }, { title: wellName }]
    }
    return [{ title: resources?.operatorView?.titlePlural }]
  }, [resource, padId, padName, wellName, wellId])

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    setLoading(true)
    const queryString = getQueryString();
    axiosInstance()
      .get(`${routes[camelCase(resource)]?.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data } }) => {
        let rows = resource === sidebarResource?.padMaster ? data?.data : data

        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setLoading(false)
      })
      .catch((error) => {
        setLoading(false)
        toastConfig.setToastConfig(error);
      })
  }

  const getQueryString = () => {
    let deepFilter = `?`;

    const filterByIds = []

    if (resource === sidebarResource?.wellMaster) {
      filterByIds.push({ field: 'padName', term: { $in: [padId] } })
    } else if (resource === sidebarResource?.serializedAsset) {
      filterByIds.push({ field: 'wellName', term: { $in: [wellId] } })
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }
    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    return deepFilter;
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, resource]);

  const handleClick = (data: any) => {
    const newPath = `${location.pathname}/${data?._id}`;
    history.push(newPath, { padName: padName || data?.padName || '', wellName: wellName || data?.wellName || '' });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const rightSideContents = () => {
    return (
      <div className="flex gap-2">
        <IconButtonTabs
          items={
            [
              {
                value: 'card',
                icon: <IoAppsSharp />,
                tooltip: 'Card View'
              },
              {
                value: 'map',
                icon: <IoMapSharp />,
                tooltip: 'Map View'
              }
            ] as const
          }
          setValue={setView}
          value={view}
        />
        <HtmlTooltip title={'Refresh'}>
          <IconButton style={{ width: 32, height: 32 }} size="small" onClick={() => fetchData()}>
            <RefreshIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>
      </div>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs isConfirmBeforeClick={true} onBreadCrumbClick={(path) => {
          if (resource === sidebarResource?.serializedAsset) {
            history.push(path, { padName: padName });
          } else if (resource === sidebarResource?.wellMaster) {
            history.push(path);
          } else {
            history.push(path);
          }
        }} routes={breadCrumbs} />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={false}
          isAddButtonVisible={false}
          rightSideContents={rightSideContents()}
        />
        {loading ? (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>

        ) : (
          <>
            {view === 'card' && (
              <CardView resource={resource} data={dataRows} clickOnCard={(data) => {
                if (resource === sidebarResource?.serializedAsset) {
                } else {
                  handleClick(data)
                }
              }} />
            )}
            {view === 'map' && (
              <MapView data={dataRows} />
            )}
          </>
        )}
      </CustomContainer>

    </section>
  )
}

export default OperatorView;

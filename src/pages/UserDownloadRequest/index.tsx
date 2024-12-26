import { Box, IconButton, TextField } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, displayDateTime } from 'src/constants/helpers';
import PreviewIcon from '@mui/icons-material/Visibility';
import GetAppIcon from '@mui/icons-material/GetApp';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { camelCase } from 'lodash';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = 'userDownloadRequest';

const UserDownloadRequest = () => {
  const toastConfig = useContext(CustomToastContext);
  const [columns, setColumns] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { page, limit, sorting } = state;
  const {
    state: { user, permissions }
  }: any = useData();

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [page, sorting, limit]);

  const fetchGridColumns = () => {
    let columns = [
      {
        accessor: 'referenceId',
        Header: 'Resource',
        width: 120,
        Cell: ({ row }) => (
          <Link
            className="text-truncate link"
            title={row?.original?.referenceLabel}
            onClick={() => window.open(`${routes[`${camelCase(row?.original?.resource)}Detail`]?.path}/${row?.original?.referenceId}`)}
          >
            {row?.original?.referenceLabel}
          </Link>
        )
      },
      {
        accessor: 'resource',
        Header: 'Resource Label',
        width: 120,
        Cell: ({ row }) => (row?.original?.resource ? <p className="text-truncate">{row?.original?.resource}</p> : <NoDataCell />)
      },
      {
        accessor: 'status',
        Header: 'Status',
        disableFilters: true,
        disableSortBy: true,
        width: 120,
        Cell: ({ row }) => (row?.original?.status ? <p className="text-truncate">{row?.original?.status}</p> : <NoDataCell />)
      },
      {
        accessor: 'date',
        Header: 'Date',
        disableFilters: true,
        disableSortBy: true,
        width: 120,
        Cell: ({ row }) => <p className="text-truncate">{displayDateTime(row?.original?.createdByDate)}</p>
      },
      ActionsRenderer
    ];
    setColumns(columns);
  };

  const handleDownload = (file: any) => {
    setIsDownloading(true);
    axiosInstance()
      .get(`user/download?fileName=${file}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        let fileExt = file?.split('.');
        var name = fileExt[0];
        var ext = fileExt.pop();
        link.setAttribute('download', name + '.' + ext);
        document.body.appendChild(link);
        link.click();
        setIsDownloading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };
  const handlePreview = (event, file) => {
    if (event) {
      toastConfig.setToastConfig({
        open: true,
        type: 'info',
        message: `File is Loading, Please wait...`
      });
    }
    setIsDownloading(true);
    axiosInstance()
      .get(`user/download?fileName=${file}`, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);

          if (percentCompleted === 100) {
            toastConfig.setToastConfig({
              message: 'File Downloaded Successfully',
              open: true,
              type: 'success'
            });
            // setTimeout(() => {
            //   setIsDownloading(false);
            // }, 2000);
          }
        }
      })
      .then(({ data }) => {
        const file = new Blob([data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const pdfWindow = window.open();
        pdfWindow.location.href = fileURL;
        setIsDownloading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title="Preview">
          <IconButton onClick={(e) => handlePreview(e, row?.original?.file)}>
            <PreviewIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
        <HtmlTooltip title="Download">
          <IconButton onClick={() => handleDownload(row?.original?.file)}>
            <GetAppIcon color="primary" fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      </>
    )
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/user-download-request${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data?.map((u) => {
            let finalObject = prepareDataForGrid(u, user);
            return finalObject;
          });
          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        }
      )
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.userDownloadRequest]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          {/* xs={12} sm={6} md={4} lg={4} */}
          <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2 lg:grid-cols-3"></div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            hideSelection={true}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </section>
  );
};

export default UserDownloadRequest;

import { Box, IconButton } from '@material-ui/core';
import { camelCase, isEmpty } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import NoDataCell from '../../components/Helpers/NoDataCell';
import routes from '../../components/Helpers/Routes';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import { gridLoadingTimeout, sidebarResource } from '../../constants/helpers';
import CustomReactTable, { useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const DOARequest = () => {

  const renderedFrom = camelCase(routes?.DOARequest.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const { state, dispatch } = useTableReducer();


  const columns: any = [
    {
      accessor: 'name',
      Header: 'Name',
      show: true,
      disabled: true,
      Cell: ({ row }) => (<Link
        className="link"
        to={row?.original?.quotation && !isEmpty(row?.original?.quotation) ? `/doa-request/quotation/${row?.original?.id}` : `/doa-request/${row?.original?.id}`}
        title={row?.original?.name}
      >
        {row?.original?.name}
      </Link>)
    },
    {
      accessor: 'quotedBy',
      Header: 'Quoted By',
      show: true,
      disabled: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.quotedBy ? (
            <Link className="link" to={`/user/detail/${row?.original?.quoteById}`} title={row?.original?.quotedBy}>
              {row?.original?.quotedBy}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'requestedBy',
      Header: 'Requested By',
      show: true,
      Cell: ({ row }) => (
        <>
          {row?.original?.requestedBy ? (
            <Link className="link" to={`/user/detail/${row?.original?.requestedById}`} title={row?.original?.requestedBy}>
              {row?.original?.requestedBy}
            </Link>
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      accessor: 'status',
      Header: 'Status',
      show: true,
      Cell: ({ row }) => (
        <div>
          <p>{row?.original?.status}</p>
        </div>
      )
    }
  ]

  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`/doa-request`)
      .then(({ data: { data } }) => {
        let rows = data.map((doa) => ({
          ...doa,
          _id: doa.id,
          name: doa.DOAName,
          quotedBy: doa.QuotedBy.firstName,
          quoteById: doa.QuotedBy.id,
          requestedBy: doa.RequestedBy.firstName,
          requestedById: doa.RequestedBy.id
        }));
        dispatch({ type: 'initialize', data: rows, count: data.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.DOARequest]} />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={'d-flex align-items-center gap-1'}>
              {isMobile && (
                <div className="d-flex flex-wrap items-center justify-between w-full">
                  <div></div>
                  <div className="flex flex-wrap items-center gap-1 ml-auto">
                    <IconButton
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                    >
                      <TbArrowsSort className="rotate-90" size={16} />
                    </IconButton>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort DOA Requests']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <IconButton
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      className={'mobileIconButton secondary'}
                      size="small"
                      onClick={handleOpen}
                    >
                      <MdOutlineFilterAlt size={16} />
                    </IconButton>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.DOARequest?.title}
                      filters={{}}
                      resource={sidebarResource.DOARequest}
                    />
                  </div>
                </div>
              )}
            </div>
            <DisplayFiltersForMobile resource={sidebarResource.DOARequest} />
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.DOARequest}
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

export default DOARequest;

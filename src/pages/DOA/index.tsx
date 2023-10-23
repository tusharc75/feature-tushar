import { IconButton } from '@material-ui/core';
import { camelCase, isEmpty } from 'lodash';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdOutlineFilterAlt, TbArrowsSort } from 'react-icons/all';
import { Link, useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import NoDataCell from '../../components/Helpers/NoDataCell';
import routes from '../../components/Helpers/Routes';
import MobileFilterDialog, { DisplayFiltersForMobile } from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { gridLoadingTimeout, sidebarResource } from '../../constants/helpers';

const DOARequest = () => {
  
  const renderedFrom = camelCase(routes?.DOARequest.title);
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const history = useHistory();
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;

  const columns: any = [
    {
      field: 'name',
      headerName: 'Name',
      show: true,
      disabled: true,
      cellRenderer: 'nameRenderer'
    },
    {
      field: 'quotedBy',
      headerName: 'Quoted By',
      show: true,
      disabled: true,
      cellRenderer: 'quotedByRenderer'
    },
    {
      field: 'requestedBy',
      headerName: 'Requested By',
      show: true,
      cellRenderer: 'requestedByRendered'
    },
    {
      field: 'status',
      headerName: 'Status',
      show: true
    }
  ]

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

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

  const NameRenderer = (params) => (
    <Link
      className="link"
      to={params.data.quotation && !isEmpty(params.data.quotation) ? `/doa-request/quotation/${params.data.id}` : `/doa-request/${params.data.id}`}
      title={params.value}
    >
      {params.value}
    </Link>
  );

  const QuotedByRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" to={`/user/detail/${params.data.quoteById}`} title={params.value}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const RequestedByRenderer = (params) => (
    <>
      {params.value ? (
        <Link className="link" to={`/user/detail/${params.data.requestedById}`} title={params.value}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    requestedByRendered: RequestedByRenderer,
    quotedByRenderer: QuotedByRenderer
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
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
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={false}
            allowSwipe={false}
            permissions={null}
            primaryField={columns?.find((d) => d.field === 'name')}
            onClick={(d) => {
              history.push(`${routes.budget.path}?id=${d._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={[]}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.budget.path}?id=${d._id}`);
            }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => { }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            additionalDetails={[]}
            chips={[]}
            owerCollaboratorInitialsOrImages=""
            onCreate={() => { }}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom}
          />
        ) : (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={150}
            allowSelection={false}
            allowAction={false}
            isClientSideGrid={true}
            loading={loading}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default DOARequest;

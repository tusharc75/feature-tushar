import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import { Link } from "react-router-dom";
import { MdSort, MdFilterList } from "react-icons/all";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from "react-icons/gi";
import styles from '../Leads/Header.module.scss';
import CustomContainer from "../../components/CustomContainer";
import { gridLoadingTimeout, gridPageSizes } from "../../constants/helpers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import routes from "../../components/Helpers/Routes";
import { useHistory } from 'react-router-dom'
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { camelCase } from "lodash";

const DOARequest = () => {
  const renderedFrom = camelCase(routes?.DOARequest.title)
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const history = useHistory()
  const [isOpenDialog, setisOpenDialog] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes
  } = state;
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));

  const [columns] = useState([
    {
      field: "name",
      headerName: "Name",
      show: true,
      disabled: true,
      cellRenderer: "nameRenderer",
    },
    {
      field: "quotedBy",
      headerName: "Quoted By",
      show: true,
      disabled: true,
      cellRenderer: "quotedByRenderer",
    },
    {
      field: "requestedBy",
      headerName: "Requested By",
      show: true,
      cellRenderer: "requestedByRendered",
    },
    {
      field: "status",
      headerName: "Status",
      show: true,
    },
  ]);

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
    fetchProductBuilder();
  }, []);

  const NameRenderer = (params) => (
    <Link
      className="link"
      to={`/doa-request/${params.data.id}`}
      title={params.value}
    >
      {params.value}
    </Link>
  );

  const QuotedByRenderer = (params) => (
    <>
      {params.value ? (
        <Link
          className="link"
          to={`/user/detail/${params.data.quoteById}`}
          title={params.value}
        >
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
        <Link
          className="link"
          to={`/user/detail/${params.data.requestedById}`}
          title={params.value}
        >
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
    quotedByRenderer: QuotedByRenderer,
  };

  const fetchProductBuilder = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/doa-request`)
      .then(({ data: { data } }) => {
        let rows = data.map((doa) => ({
          ...doa,
          name: doa.DOAName,
          quotedBy: doa.QuotedBy.firstName,
          quoteById: doa.QuotedBy.id,
          requestedBy: doa.RequestedBy.firstName,
          requestedById: doa.RequestedBy.id,
        }));
        dispatch({ type: "initialize", data: rows, count: data.length });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.DOARequest]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={12} md={6} sm={12} className={isMobile ? styles.mobile_panel : 'd-flex align-items-center gap-1'}>
              {isMobile && (
                <>
                  <Grid style={{ display: 'inline-flex' }}>
                    <Button
                      onClick={handleClickOpen}
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      color="secondary"
                      variant="text"
                      disableElevation
                      startIcon={<MdSort />}
                      className={'sort-filter-tablet'}
                      style={isTablet ? { marginLeft: '50px' } : {}}
                    >
                      Sort
                    </Button>
                    <MobileSortDialog
                      isOpen={sortOpen}
                      handleClose={handleClickClose}
                      contentPart={null}
                      secHeading={['Sort DOA Requests']}
                      columns={columns}
                      dispatch={dispatch}
                    />

                    <Button
                      id="demo-customized-button"
                      aria-controls="demo-customized-menu"
                      aria-haspopup="true"
                      aria-expanded={'true'}
                      variant="text"
                      color="secondary"
                      disableElevation
                      className={'sort-filter-tablet'}
                      startIcon={<MdFilterList />}
                      onClick={handleOpen}
                    >
                      Filter
                    </Button>

                    <MobileFilterDialog
                      isOpen={isOpenDialog}
                      handleClose={handleFilterClose}
                      contentPart={null}
                      columns={columns}
                      dispatch={dispatch}
                      title={routes?.DOARequest?.title}
                      filters={{}}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </div>
        {isMobile && !isTablet
          ? <CustomSwipableList
            allowSelection={false}
            allowSwipe={false}
            permissions={null}
            primaryField={columns?.find(d => d.field === "name")}
            onClick={(d) => {
              history.push(`${routes.budget.path}?id=${d._id}`)
            }}
            dataRows={dataRows}
            selectedRecords={[]}
            dispatch={dispatch}
            onEdit={(d) => {
              history.push(`${routes.budget.path}?id=${d._id}`)
            }}
            extraParamsToCheckDelete={true}
            onDelete={(d) => {

            }}
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

          /> : <CustomAgGrid
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
            refreshGrid={fetchProductBuilder}
          />}
      </CustomContainer>
    </Fragment>
  );
};

export default DOARequest;

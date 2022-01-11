import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../axios/axiosInstance";
import { GiAbstract055 } from "react-icons/gi";
import CustomContainer from "../../components/CustomContainer";
import { gridLoadingTimeout, gridPageSizes } from "../../constants/helpers";
import CustomAgGrid, { reducer, intialState } from "../../components/AgGridComponents/CustomAgGrid";
import routes from "../../components/Helpers/Routes";
import { useHistory } from 'react-router-dom'
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";

const DOARequest = () => {
  const toastConfig = useContext(CustomToastContext);
  const [gridApi, setGridApi] = useState(null);
  const history = useHistory()

  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes
  } = state;
  const columnState = JSON.parse(localStorage.getItem("doaRequestPage"));

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
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[{ title: routes.DOARequest.title }]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className="header-panel">
          <Grid container>
            <Grid item xs={6} className="d-flex align-items-center gap-1">
              <GiAbstract055 />{" "}
              <span className="listingHeader">{routes.DOARequest.title}</span>
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
            renderedFrom={"doa-request"}

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
            renderedFrom="doaRequestPage"
            refreshGrid={fetchProductBuilder}
          />}
      </CustomContainer>
    </Fragment>
  );
};

export default DOARequest;

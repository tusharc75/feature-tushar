import React, { useEffect, useState, useContext, useReducer, Fragment } from "react";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomContainer from "../../components/CustomContainer";
import { FaWpforms } from 'react-icons/fa';
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout } from "../../constants/helpers";

const FormBuilder = () => {

  const toastConfig = useContext(CustomToastContext)

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columns = [
    { field: "resource", headerName: "Resource", show: true, disabled: true, cellRenderer: "resourceRenderer" },
  ];
  //  Grid Variables - End

  const ResourceRenderer = params => <Link className="link"
    to={"/form-builder/" + params.data.resource}>
    {params.data.resource}
  </Link>

  useEffect(() => {
    fetchGetBrandResource();
  }, []);

  const frameworkComponents = {
    resourceRenderer: ResourceRenderer
  };

  const fetchGetBrandResource = () => {
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance().get(`/sa-formbuilder/resource`).then(({ data: { data } }) => {
      dispatch({ type: "initialize", data: data, count: data.length });
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);

    }).catch((error) => {
      toastConfig.setToastConfig(error);
      dispatch({ type: "loading", loading: false });
    });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.formBuilder]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Grid container spacing={1} >
          <Grid item xs={12} className="d-flex align-items-center gap-1">
            <div className="header-panel d-flex align-items-center gap-1">
              <FaWpforms className="headerLogo" /> <span className="listingHeader">{routes.formBuilder.title}
              </span>
            </div>
          </Grid>
        </Grid>

        <CustomAgGrid columns={columns} dataRows={dataRows} frameworkComponents={frameworkComponents} setGridApi={setGridApi}
          dispatch={dispatch} rowCount={rowCount} limit={limit} pageSizes={pageSizes} page={page} allowAction={false} allowSelection={false}
          isClientSideGrid={true} loading={loading}
          refreshGrid={fetchGetBrandResource}
          renderedFrom={routes.formBuilder.title}
        />

      </CustomContainer>
    </Fragment>
  );
};

export default FormBuilder;

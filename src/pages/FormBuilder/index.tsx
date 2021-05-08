import React, { useEffect, useState, useContext } from "react";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Autocomplete } from "@material-ui/lab";
import { Box, TextField, Typography } from "@material-ui/core";
import Loader from "../../components/Loader";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomContainer from "../../components/CustomContainer";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { FaWpforms } from 'react-icons/fa';
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
const FormBuilder = () => {


  const toastConfig = useContext(CustomToastContext)
  const [brandResource, setBrandResource] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGetBrandResource();
  }, []);


  const fetchGetBrandResource = async () => {
    setLoading(true)
    axiosInstance().get(`/sa-formbuilder/resource`).then(({ data: { data } }) => {
      setBrandResource(data);
      setLoading(false)
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };


  const columns = [
    {
      field: "resource",
      headerName: "Resource",
      flex: 1,
      renderCell: (params) => (
        <Link className="link"
          to={"/form-builder/resource?resource=" + params.row.resource}>
          {" "}
          {params.row.resource}
        </Link>
      ),
    },
  ];

  return (
    <Layout>
      <Grid container>
        <Grid item md={12} sm={12} xs={12}>
          <CustomBreadCrumbs routes={[routes.formBuilder]} />
        </Grid>
      </Grid>
      <CustomContainer>
        <Grid container spacing={1} >
          <Grid item xs={12} className="d-flex align-items-center gap-1">
            <div className="header-panel d-flex align-items-center gap-1">
              <FaWpforms className="headerLogo" /> <span className="listingHeader">Form Builder
            </span>
            </div>
          </Grid>
        </Grid>
        <div className="listing-grid">
          <DataGrid
            components={{
              Toolbar: CustomDataGridToolbar,
              NoRowsOverlay: CustomDataGridNoDataFound,
            }}
            rows={brandResource}
            columns={columns.map((column) => ({
              ...column,
              disableClickEventBubbling: true,
            }))}
            loading={loading}
            pageSize={25}
            pagination
            density="compact"
          />
        </div>

      </CustomContainer>
    </Layout>
  );
};

export default FormBuilder;

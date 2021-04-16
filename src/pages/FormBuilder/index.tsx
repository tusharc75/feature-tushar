import React, { useEffect, useState, useContext } from "react";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import Grid from "@material-ui/core/Grid";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { Autocomplete } from "@material-ui/lab";
import { Box, TextField, Typography } from "@material-ui/core";
import Loader from "../../components/Loader";
import DataGridCustomToolbar from './../../components/Helpers/DataGridCustomToolbar';
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";

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
        <Link
          to={"/form-builder/resource?resource=" + params.row.resource}>
          {" "}
          {params.row.resource}
        </Link>
      ),
    },
  ];

  return (
    <Layout>
      <CustomBreadCrumbs routes={[routes.formBuilder]} />
      <Box p={2} bgcolor="white">
        <div style={{ height: window.innerHeight - 120, width: "100%" }}>
          <DataGrid
            components={{
              Toolbar: DataGridCustomToolbar,
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
      </Box>
    </Layout>
  );
};

export default FormBuilder;

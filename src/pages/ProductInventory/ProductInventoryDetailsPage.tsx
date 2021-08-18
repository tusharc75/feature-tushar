import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, IconButton, Paper, Dialog } from "@material-ui/core";
import { ControlPoint } from "@material-ui/icons";
import { Skeleton } from "@material-ui/lab";
import { useParams, useHistory } from "react-router-dom";
import axiosInstance from "../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import { useData } from "../../StateProvider/Provider";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { productInventory } from "../../constants/helpers";
import CreateProductInventory from "./CreateProductInventory";

const ProductInventoryDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions },
    dispatch,
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [productInventoryData, setProductInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productInventoryFields, setProductInventoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);


  useEffect(() => {
    if (id) {
      getProductInventoryFields();
      fetchProductInventoryData();
    }
    // eslint-disable-next-line
  }, [id]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    // mainPoint['Account Name'] = data?.accountName?.optionLabel || '';
    setMainPoints(mainPoint);
  };

  const fetchProductInventoryData = async () => {
    setLoading(true);
    try {
      const {
        data: { data },
      } = await axiosInstance().get(`${productInventory.api}/${id}`);

      handleMainPoints(data);
      setHeadingLbl(data._id);
      setCustomizedRoutes([routes.productInventory, { title: `${data._id}` }]);
      setProductInventoryData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getProductInventoryFields = () => {
    axiosInstance()
      .get("/field?resource=Product Inventory")
      .then(({ data }) => {
        setProductInventoryFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {

    axiosInstance().put(`${productInventory.api}/remove`, { "ids": [] }).then(() => {
      setShowConfirmBox(false);
      history.goBack();
    }).catch((error) => {
      toastConfig.setToastConfig(error)
      setShowConfirmBox(false);
    });
  }

  return (
    <>
      <Fragment>

        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!productInventoryData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (

                <DetailsPageHeader
                  heading={headingLbl}
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {permissions?.entity?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}

                </DetailsPageHeader>
              )}


              <Box>
                {loading || !productInventoryFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={productInventoryData} fields={productInventoryFields} />
                  </>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={12} lg={12}>

                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this product inventory ?`
          }
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog &&
        <CreateProductInventory
          productInventoryId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
          }}
        />
      }
    </>
  );
};

export default ProductInventoryDetailsPage;

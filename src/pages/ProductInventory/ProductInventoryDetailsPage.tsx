import { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Paper } from "@material-ui/core";
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
import { productInventory, getObjKeysWithValues } from "../../constants/helpers";
import CreateProductInventory from "./CreateProductInventory";
import ExpandMore from '@material-ui/icons/ExpandMore';
import MenuItem from "@material-ui/core/MenuItem"
import Menu from "@material-ui/core/Menu"
import ReasonDialog from "./ReasonDialog"

const ProductInventoryDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [productInventoryData, setProductInventoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productInventoryFields, setProductInventoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [statusOptions, setStatusOptions] = useState([])
  const [showReasonDialog, setShowReasonDialog] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    if (id) {
      getProductInventoryFields();
      fetchProductInventoryData();
    }
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
      setCustomizedRoutes([routes.productInventory, { title: `${data?.serialNumber || data?._id}` }]);
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
        if (data.data && data.data.length) {
          data.data.some(o => {
            if (o?.fieldData?.fieldName === "status") {
              setStatusOptions([...o.fieldData.option])
              return true
            }
          })
        }
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

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const handleStatusChange = o => {
    if (o.optionValue === "scrapping") {
      setShowReasonDialog(true)
    }
    else {
      handleUpdateData({ status: o.optionValue })
    }
  }

  const handleUpdateData = (obj) => {
    setUpdateLoading(true)
    if (obj.status) {
      const fieldsDataForUpdate = productInventoryFields.filter((obj) => obj.isUpdate).map((d: any) => d.fieldData);
      let values = getObjKeysWithValues(productInventoryData, fieldsDataForUpdate)
      values["status"] = obj.status
      if (obj.reason) values["statusReason"] = obj.reason
      values["_id"] = productInventoryData._id
      axiosInstance().put(`${productInventory.api}`, values).then(({ data: { data } }) => {
        setUpdateLoading(false)
        fetchProductInventoryData()
      }).catch((error) => {
        setUpdateLoading(false)
        toastConfig.setToastConfig(error);
      });
    }
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
                  {permissions?.productInventory?.isUpdate && (
                    <>
                      <Button
                        variant="outlined"
                        color="default"
                        size="small"
                        onClick={openActions}
                        disabled={updateLoading}
                        aria-controls="action-menu"
                      >
                        Status <ExpandMore />
                      </Button>
                      <Menu
                        anchorEl={anchorEl}
                        keepMounted
                        getContentAnchorEl={null}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'left'
                        }}
                        id="action-menu"
                        open={Boolean(anchorEl)}
                        onClose={closeActions}>
                        {
                          statusOptions.map(o => {
                            return <MenuItem
                              onClick={() => handleStatusChange(o)}
                              value={o}>{o?.optionLabel}</MenuItem>
                          })
                        }
                      </Menu>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleOpenUpdateDialog}
                      >
                        Edit
                      </Button>
                    </>
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
            fetchProductInventoryData()
          }}
        />
      }
      {
        showReasonDialog ?
          <ReasonDialog
            onClose={() => setShowReasonDialog(false)}
            onAddReason={(reason) => {
              handleUpdateData({ status: "scrapping", reason: reason })
              setShowReasonDialog(false)
            }}
          /> : null
      }
    </>
  );
};

export default ProductInventoryDetailsPage;

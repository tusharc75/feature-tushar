import React, { useState, useEffect, useContext, Fragment } from "react";
import { Grid, Box, Button, Typography, Paper } from "@material-ui/core";
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
import ManageAddressDialog from "../../components/Address/ManageAddressDialog";
import DeleteButton from "../../components/Helpers/DeleteButton";



const AddressDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [addressFields, setAddressFields] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [addressResource, setAddressResource] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([
    routes.address,
  ]);


  useEffect(() => {
    if (id) {
      getAddressFields();
      fetchAddressData();
    }
  }, [id]);

  const fetchAddressData = async () => {
    setLoading(true);
    try {
      const { data: { data }, } = await axiosInstance().get(`/address/${id}`);
      setHeadingLbl(data.fullAddress);
      setAddressData(data);
      setAddressResource({ id: data._id });
      setCustomizedRoutes([routes.address, { title: data.fullAddress }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getAddressFields = () => {
    axiosInstance()
      .get("/field?resource=Address")
      .then(({ data }) => {
        setAddressFields(data.data?.filter((field) => field.isRead))
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteWarehouse = () => {
    if (id) {
      if (permissions?.address?.isDelete) {
        axiosInstance()
          .put(`/address/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.goBack();
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };


  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };


  return (
    <>
      {openUpdateDialog && (
        <ManageAddressDialog
          onClose={closeUpdateDialog}
          addressData={addressData}
          onSuccess={() => {
            fetchAddressData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false)
          }}
          onOk={handleDeleteWarehouse}
        />
      )}
      <Fragment>

        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!addressData ? (
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
                  showHeading={true}
                >
                  {permissions?.address?.isUpdate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  )}
                  <Box component="span" marginX={1} />
                  {permissions?.address?.isDelete && (
                    <span
                      title={
                        id
                          ? "Primarily selected address can't be deleted"
                          : "Permanently delete this address"
                      }
                    >
                      <DeleteButton
                        text="Delete"
                        onClick={() => setShowConfirmBox(true)}
                      />
                    </span>
                  )}
                </DetailsPageHeader>
              )}
              <Box>
                {loading || !addressFields.length ? (
                  <Grid container spacing={2} style={{ padding: "8px" }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={addressData} fields={addressFields} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Fragment>

    </>
  );
};

export default AddressDetailPage;

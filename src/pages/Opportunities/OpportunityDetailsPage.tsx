import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid, Paper } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { useHistory, useParams } from "react-router-dom";
import TabPanel from "../../components/TabPanel";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import DetailsPage from "../../components/Shared/DetailsPage";
import axiosInstance from "./../../axios/axiosInstance";
import routes from "../../components/Helpers/Routes";
import { useData } from "../../StateProvider/Provider";
import Activity from "../../components/Activity";
import DeleteButton from "../../components/Helpers/DeleteButton";
import moment from "moment";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageOpportunityDialog from "./ManageOpportunityDialog/ManageOpportunityDialog";
import _ from "lodash";
import { customerAccount, supplierAccount, yyyyMMDD } from "../../constants/helpers";
import { opportunity } from '../../constants/helpers'

function OpportunityDetailsPage() {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(true);
  const [opportunityData, setOpportunityData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [opportunityFields, setOpportunityFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };
  let { id } = useParams();

  const [opportunityPermissions, setOpportunityPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  const { opportunityResource, opportunityApi } = opportunity

  useEffect(() => {
    if (permissions) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (id) {
      fetchOpportunityData();
    }
  }, [id]);

  const fetchOpportunityData = () => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${opportunityApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          handleMainPoints(data);
          setHeadingLbl(data.opportunityName);
          handleAllowToEditList(data);
          setOpportunityData(data);
          getOpportunityFields();
          setCustomizedRoutes([
            routes.opportunity,
            { title: `${data.opportunityName}` },
          ]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      accountName: data?.accountName?.optionLabel || "",
      closeDate: yyyyMMDD(data.closeDate),
      amount: data.amount || "",
      opportunityOwner: data?.owner?.optionLabel || "",
    };
    setMainPoints(tempMp);
  };

  const getOpportunityFields = () => {
    if (selectedEntity) {
      axiosInstance()
        .get(`/field?resource=Opportunity&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setOpportunityFields(data);
          setLoading(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleAllowToEditList = (opportunityDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit =
        opportunityDetails.owner?.optionValue &&
        opportunityDetails.owner.optionValue === userId;

      if (
        !allowToEdit &&
        opportunityDetails.collaborator &&
        opportunityDetails.collaborator.length > 0
      ) {
        allowToEdit =
          opportunityDetails.collaborator.findIndex(
            (d) => d.optionValue === userId
          ) > -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleDeleteOpportunity = () => {
    if (opportunityData?._id) {
      axiosInstance()
        .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
          ids: [opportunityData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          goBackToListing();
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };
  const goBackToListing = () => {
    history.push({
      pathname: routes.opportunity.path,
    });
  };

  // const handleUpdateOpportunity = (values) => {
  //   setUpdating(true);
  //   const updatedData = {
  //     ...values,
  //     _id: opportunityData._id,
  //   };

  //   axiosInstance()
  //     .put("/opportunity", updatedData)
  //     .then(({ data }) => {
  //       toastConfig.setToastConfig({ open: true, type: "success", message: data.message });
  //       setUpdating(false);
  //       goBackToListing();

  //     })
  //     .catch((error) => {
  //       toastConfig.setToastConfig(error);
  //       setUpdating(false);
  //     });
  // };

  const quickLinks = [
    {
      label: "Call a log",
      count: 0,
    },
    {
      label: "New Task",
      count: 0,
    },
    {
      label: "Email",
      count: 0,
    },
    {
      label: "New Event",
      count: 0,
    },
  ];
  return (
    <>
      <Layout>

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Paper>

              {!opportunityData ? (
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
                  logo={
                    opportunityData?.leadLogo ? opportunityData.leadLogo : undefined
                  }
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                  {handleAllowToEditList ? (
                    <Button
                      disabled={
                        opportunityData.owner.optionValue !== user.user._id &&
                        opportunityData.collaborator.length === 0
                      }
                      variant="contained"
                      color="primary"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>
                  ) : null}
                  <Box component="span" marginX={1} />
                  {opportunityPermissions.isDelete &&
                    opportunityData?.owner.optionValue &&
                    user?.user?._id &&
                    opportunityData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </DetailsPageHeader>
              )}

              {loading ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6}>
                        <Skeleton
                          variant="text"
                          width="100px"
                          height="16px"
                        />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <>
                  <TabPanel value={currentTabIndex} index={0}>
                    <Box padding="16px">
                      <DetailsPage
                        data={opportunityData}
                        fields={opportunityFields}
                      />
                    </Box>
                  </TabPanel>
                  <TabPanel value={currentTabIndex} index={1}>
                    <Activity />
                  </TabPanel>
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Paper>
              {!opportunityData ? (
                <Box>
                  <Skeleton variant="text" width="100px" height="25px" />
                  <Box marginY={1} />
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Skeleton width="100%" height="50px" />
                  ))}
                </Box>
              ) : (
                <div>
                  <Activity
                    relatedTo={[
                      {
                        type: opportunityData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
                        referenceId: opportunityData?.customerAccountName ? opportunityData?.customerAccountName?.optionValue : opportunityData?.supplierAccountName?.optionValue,
                        access: false,
                      },
                      {
                        type: "opportunity",
                        referenceId: opportunityData?._id,
                        access: true,
                      },
                    ]}
                    handleActivityRefresh={() => { }}
                  />
                </div>
              )}
            </Paper>
          </Grid>
        </Grid>
        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this opportunity`}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteOpportunity}
          />
        ) : null}
        {/* {openUpdateDialog ? (
            <ManageOpportunity
              isNew={false}
              open={openUpdateDialog}
              onClose={closeUpdateDialog}     
              entityData={{ fields: opportunityFields.map((f) => { return f.fieldData }), initialValues: getObjKeysWithValues(opportunityData, opportunityFields.map((f) => { return f.fieldData })) }}
              handleSubmit={handleUpdateOpportunity}
            />
          ): null} */}

        {openUpdateDialog && (
          <ManageOpportunityDialog
            open={openUpdateDialog}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchOpportunityData();
            }}
            onClose={() => {
              setOpenUpdateDialog(false);
            }}
            isNew={false}
            dataToUpdate={opportunityData}
            resource={null}
          // opportunityApi={opportunityApi}
          />
        )}
      </Layout>
    </>
  );
}

export default OpportunityDetailsPage;

import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid, Typography } from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import { Skeleton } from "@material-ui/lab";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { Link } from "react-router-dom";
import contactClass from "./contact.module.scss";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { useData } from "../../StateProvider/Provider";
import { contactPage } from "../../routes/Contacts";
import DetailsPage from "../../components/Shared/DetailsPage";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from "../../components/Helpers/Routes";
import axiosInstance from "./../../axios/axiosInstance";
import Activity from "../../components/Activity";
import {
  getObjKeysWithValues,
  isObjectEmpty,
  sidebarResource,
} from "./../../constants/helpers";
import DeleteButton from "../../components/Helpers/DeleteButton";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageContact from "./ManageContact/ManageContact";

const Roles = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute },
    account: { accountResource },
    contactBreadcrumb,
  } = props;
  const history = useHistory();
  const {
    state: { user, selectedEntity },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [contactData, setContactData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [contactFields, setContactFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [isUpdating, setUpdating] = useState(false);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [contactPermissions, setContactPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  let { id } = useParams();

  // useEffect(() => {
  //     if (id) {
  //         fetchContactData()
  //     }
  // }, [id]);

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasContactPermission = data.find(
        (d) => d.name == contactPermission
      );
      if (hasContactPermission) {
        setContactPermissions({
          isCreate: hasContactPermission.isCreate,
          isUpdate: hasContactPermission.isUpdate,
          isRead: hasContactPermission.isRead,
          isDelete: hasContactPermission.isDelete,
        });
      }

      if (id) {
        fetchContactData();
      }
    }
  }, [user]);

  const fetchContactData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/${contactApi}/${id}`)
      .then(({ data: { data } }) => {
        handleMainPoints(data);
        let name = [data.firstName, data.middleName, data.lastName]
          .filter((d) => d)
          .join(" ");

        if (data?.salutation?.optionLabel) {
          name = data.salutation.optionLabel + name;
        }
        setHeadingLbl(name);
        handleAllowToEditList(data);
        setContactData(data);
        getContactFields();

        setCanEdit(
          [...data?.collaborator, data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
        );

        setCustomizedRoutes([
          contactBreadcrumb,
          { title: `${data.firstName} ${data.lastName}` },
        ]);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      phone: data.phone || "",
      email: data.email || "",
      title: data.title || "",
    };
    if (data?.accountName?.optionLabel) {
      tempMp["Account Name"] = data.accountName.optionLabel;
    }

    setMainPoints(tempMp);
  };

  const getContactFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource[contactResource]}`)
      .then(({ data: { data } }) => {
        setContactFields(data.filter((d) => d.isUpdate || d.isRead));
        setLoading(false);
      });
  };

  const quickLinks = [
    {
      label: "Account Heirarchy",
      count: 0,
    },
    {
      label: "Projects",
      count: 0,
    },
    {
      label: "Opportunity",
      count: 0,
    },
    {
      label: "Quotes",
      count: 0,
    },
    {
      label: "Accounts Teams",
      count: 0,
    },
    {
      label: "Contacts",
      count: 0,
    },
  ];

  const handleDeleteContact = () => {
    if (contactData?._id) {
      axiosInstance()
        .put(`/${contactApi}/remove`, { ids: [contactData._id] })
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
      pathname: contactPage.path,
    });
  };

  const handleAllowToEditList = (contactDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit =
        contactDetails.owner?.optionValue &&
        contactDetails.owner.optionValue == userId;

      if (
        !allowToEdit &&
        contactDetails.collaborator &&
        contactDetails.collaborator.length > 0
      ) {
        allowToEdit =
          contactDetails.collaborator.findIndex(
            (d) => d.optionValue == userId
          ) > -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleOpneUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleUpdateContact = (values) => {
    setUpdating(true);
    if (values.employees) {
      values.employees = parseInt(values.employees);
    }
    const updatedData = {
      ...values,
      _id: contactData._id,
    };

    axiosInstance()
      .put(`/${contactApi}`, updatedData)
      .then(({ data }) => {
        fetchContactData();
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setUpdating(false);
        setOpenUpdateDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setUpdating(false);
      });
  };
  return (
    <>
      <Layout>
        {openUpdateDialog && (
          // <UpdateDetailsDialog
          //     title={`Editing  ${contactData.firstName}`}
          //     openDialog={openUpdateDialog}
          //     onClose={closeUpdateDialog}
          //     data={contactData}
          //     fields={contactFields}
          //     isUpdating={isUpdating}
          //     handleUpdate={handleUpdateContact}
          // />
          <ManageContact
            isNew={false}
            open={openUpdateDialog}
            onClose={closeUpdateDialog}
            entityData={{
              fields: contactFields.map((f) => {
                return f.fieldData;
              }),
              initialValues: getObjKeysWithValues(
                contactData,
                contactFields.map((f) => {
                  return f.fieldData;
                })
              ),
            }}
            fields={contactFields}
            loading={loading}
            handleSubmit={handleUpdateContact}
          // contactResource={contactResource}
          // contactApi={contactApi}
          />
        )}
        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>

        <div>
          <DetailsPageHeader
            heading={headingLbl}
            logo={
              contactData?.contactLogo ? contactData.contactLogo : undefined
            }
            mainPoints={mainPoints}
            // style={{ marginTop: "150px", minHeight: "200px" }}
            showHeading={true}
          >
            {contactPermissions.isUpdate && canEdit ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpneUpdateDialog}
              >
                Edit
              </Button>
            ) : null}

            <Box component="span" marginX={1} />
            {contactPermissions.isDelete &&
              contactData?.owner?.optionValue &&
              user?.user?._id &&
              contactData.owner.optionValue === user.user._id ? (
              <DeleteButton
                text="Delete"
                onClick={() => setShowConfirmBox(true)}
              />
            ) : null}
          </DetailsPageHeader>

          <div className={`${contactClass.detail_page_container}`}>
            <Container>
              <Grid container spacing={3}>
                <Grid item sm={8} md={8} lg={8}>
                  <div
                    className={`${contactClass.detail_page_div1}`}
                  // style={{ pointerEvents: allowedToEdit ? "" : "none" }}
                  >
                    {
                      loading ? (
                        <Grid container spacing={2}>
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                            (i) => (
                              <Grid item sm={6} md={6}>
                                <Skeleton
                                  variant="text"
                                  width="100px"
                                  height="16px"
                                />
                                <Box marginY={1} />
                                <Skeleton width="100%" height="50px" />
                              </Grid>
                            )
                          )}
                        </Grid>
                      ) : (
                        <DetailsPage
                          data={contactData}
                          fields={contactFields}
                        />
                      )

                      // <DetailsPage
                      //     data={contactData}

                      //     fields={contactFields}
                      //     isUpdating={isUpdating}
                      //     canEdit={allowedToEdit}
                      //     handleUpdate={handleUpdateContact}
                      //     sourceComponent="contact"
                      // />
                    }
                  </div>
                </Grid>
                <Grid
                  item
                  sm={4}
                  md={4}
                  lg={4}
                  className={`${contactClass.custom_grid}`}
                >
                  {!isObjectEmpty(contactData) && (
                    <div>
                      <Activity
                        relatedTo={[
                          {
                            type: accountResource,
                            referenceId: contactData?.accountName?.optionValue,
                            access: false,
                          },
                          {
                            type: contactResource,
                            referenceId: contactData._id,
                            access: true,
                          },
                        ]}
                        handleActivityRefresh={() => { }}
                      />
                    </div>
                  )}
                  {/* <QuickLinks quickLinks={quickLinks} /> */}

                  {/* <div className={`${contactClass.detail_page_div2}`}>
                    {quickLinks && quickLinks.length
                      ? quickLinks.map((k, index) => {
                        return (
                          <Link key={index} className="link">
                            {k.label || ""}({k.count || 0})
                          </Link>
                        );
                      })
                      : null}
                  </div> */}
                  {/* <div className={`${contactClass.detail_page_div3}`}>
                    <Typography color="primary" variant="h6">
                      Related Accounts
                    </Typography>
                    <Box className={`${contactClass.custom_box1}`}></Box>
                  </div> */}
                </Grid>
              </Grid>
              {showConfirmBox ? (
                <ConfirmationDialog
                  open={showConfirmBox}
                  message={`Are you sure you want to delete this Contact ?`}
                  onClose={() => setShowConfirmBox(false)}
                  onOk={handleDeleteContact}
                />
              ) : null}
            </Container>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Roles;

import React, { useState, useEffect, useContext } from "react";
import { Box, Button, Grid, Paper, Tab, Tabs, Typography } from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import Layout from "../../components/Layout";
import { Skeleton } from "@material-ui/lab";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { Link } from "react-router-dom";
import contactClass from "./contact.module.scss";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { useData } from "../../StateProvider/Provider";
import { contactPage } from "../../routes/Contacts";
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
import DetailsPage from "../../components/Shared/DetailsPage";
import OrgChartContainer from "../../components/OrgChart/OrgChartContainer";
import QuickLinks, { IQuickLinks } from "../../components/QuickLinks/QuickLinks";
import { FcFlowChart } from "react-icons/fc";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";

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
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [orgChartData, setOrgChartData] = useState([])
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
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
          [...data?.collaborator ?? [], data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
        );

        setCustomizedRoutes([
          contactBreadcrumb,
          { title: [data.firstName, data.lastName].filter(d => d).join(" ") },
        ]);

        let orgChartData = [];

        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.map(d => {
            orgChartData.push({
              id: d._id,
              name: [d.firstName, d.middleName, d.lastName]
                .filter((d) => d)
                .join(" "),
              parentId: d.reportsTo ? d.reportsTo : 0,
              current: false
            })
          })
        }

        orgChartData.push({
          id: data._id,
          name: [data.firstName, data.middleName, data.lastName]
            .filter((d) => d)
            .join(" "),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          current: true
        })

        setOrgChartData(orgChartData);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: "Org Chart",
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      // icon: <TiFlowChildren />,
      show: true,
      class: "account"
    },
    // {
    //   label: "Projects",
    //   count: 0,
    //   show: true,
    //   icon: <FcMultipleSmartphones />,
    //   class: "project"
    // },
    // {
    //   label: "Opportunity",
    //   count: opportunities ? opportunities.length : 0,
    //   show: permissions?.opportunity?.isRead ?? false,
    //   icon: <FcBinoculars />,
    //   class: "opportunity",
    //   onClick: () => {
    //     history.push({
    //       pathname: `/opportunity`,
    //       state: {
    //         accountId: accountData._id,
    //         accountName: accountData.accountName,
    //       },
    //     });
    //   },
    // },
    // {
    //   label: "Quotes",
    //   count: 0,
    //   show: true,
    //   icon: <BsChatSquareQuoteFill />,
    //   class: "quotes"
    // },
    // {
    //   label: "Accounts Teams",
    //   count: 0,
    //   show: true,
    //   icon: <FcConferenceCall />,
    //   class: "teams"
    // },
    // {
    //   label: "Contacts",
    //   count: relatedContacts ? relatedContacts.length : 0,
    //   icon: <FcContacts />,
    //   class: "contact",
    //   onClick: () => {
    //     history.push({
    //       pathname: `/${contactRoute}`,
    //       state: {
    //         accountId: accountData._id,
    //         accountName: accountData.accountName,
    //       },
    //     });
    //   },
    //   show:
    //     permissions && permissions[contactResource]
    //       ? permissions[contactResource].isRead
    //       : false,
    // },
  ].filter((d) => d.show);

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
            loading={loading}
            handleSubmit={handleUpdateContact}
          // contactResource={contactResource}
          // contactApi={contactApi}
          />
        )}

        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>

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

                  <>
                    <Tabs className="oms-tab" value={currentTabIndex}
                      onChange={(index, newValue) => {
                        setCurrentTabIndex(newValue);
                      }}
                      indicatorColor="primary"
                      textColor="primary"
                      aria-label="icon tabs example"
                    >
                      <Tab
                        label="Details"
                        aria-controls="a11y-tabpanel-0"
                        id="a11y-tab-0"
                      />
                      <Tab
                        label="Org Chart"
                        aria-controls="a11y-tabpanel-1"
                        id="a11y-tab-1"
                      />
                    </Tabs>
                    <Box hidden={currentTabIndex !== 0}>
                      <DetailsPage
                        data={contactData}
                        fields={contactFields}
                      />
                    </Box>
                    <Box hidden={currentTabIndex !== 1}>
                      <OrgChartContainer data={orgChartData} />
                    </Box>
                  </>
                )
              }
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper>
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


              <QuickLinks quickLinks={quickLinks} />

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
            </Paper>
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

        {
          orgChartInFullScreenDialog && <FullScreenDialog
            heading="Org Chart"
            open={orgChartInFullScreenDialog}
            close={() => {
              setOrgChartInFullScreenDialog(false);
            }}
          >
            <OrgChartContainer data={orgChartData} />
          </FullScreenDialog>
        }
      </Layout>
    </>
  );
};

export default Roles;

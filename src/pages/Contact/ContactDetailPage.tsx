import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Card, CardContent, Grid, Paper, Tab, Tabs, Typography, List } from '@material-ui/core';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { Skeleton } from '@material-ui/lab';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import { Link } from 'react-router-dom';
import contactClass from './contact.module.scss';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { useData } from '../../StateProvider/Provider';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import axiosInstance from './../../axios/axiosInstance';
import Activity from '../../components/Activity';
import { getObjKeysWithValues, isObjectEmpty, sidebarResource, customerAccount, processFieldName } from './../../constants/helpers';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageContact from './ManageContact/index';
import DetailsPage from '../../components/Shared/DetailsPage';
import OrgChartContainer from '../../components/OrgChart/OrgChartContainer';
import QuickLinks, { IQuickLinks } from '../../components/QuickLinks/QuickLinks';
import { FcFlowChart } from 'react-icons/fc';
import FullScreenDialog from '../../components/Helpers/FullScreenDialog';
import BoxWithBorder from '../../components/BoxWithBorder';
import ListItem from '@material-ui/core/ListItem/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import { ListItemText } from '@material-ui/core';
import { AiOutlineMail } from 'react-icons/ai';
import { BiPhone } from 'react-icons/bi';
import { FiStar } from 'react-icons/fi';
import OpportunityInAccordian from '../../components/OpportunityInAccordian/OpportunityInAccordian';
import ProjectInAccordion from '../../components/ProjectInAccordion/ProjectInAccordion';
import QuotesInAccordion from '../../components/QuotesInAccordion/QuotesInAccordion';
import ProcessFlow from '../../components/ProcessFlow';
import AdditionalDialogPopUp from '../../components/AdditionalDialogPopUp';
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import routes from '../../components/Helpers/Routes';

const ContactDetailsPage = (props) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    contact: { contactApi, contactResource, contactRoute },
    account: { accountResource },
    contactBreadcrumb
  } = props;
  const history = useHistory();
  const {
    state: { user, permissions, selectedEntity }, dispatch
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [contactData, setContactData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [contactFields, setContactFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false);
  const [showActivity, setActivityShow] = useState(true);
  const [additionalFieldName, setAdditionalFieldName] = useState('');
  const [contactPermissions, setContactPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false
  });
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [orgChartData, setOrgChartData] = useState([]);
  const [orgChartInFullScreenDialog, setOrgChartInFullScreenDialog] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [projectSales, setProjectSales] = useState([]);
  const [quotes, setQuotes] = useState([]);

  let { id } = useParams();

  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([]);

  useEffect(() => {
    const hasContactPermission = permissions[contactResource];
    if (hasContactPermission) {
      setContactPermissions({
        isCreate: hasContactPermission.isCreate,
        isUpdate: hasContactPermission.isUpdate,
        isRead: hasContactPermission.isRead,
        isDelete: hasContactPermission.isDelete
      });
    }

    if (id) {
      fetchContactData();
      fetchRelatedData();
    }
  }, [id]);

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = contactFields.find((d) => d.isRead && d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase());
      if (processSteps && processSteps.isRead && contactData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex((d) => d.optionLabel === contactData[processFieldName]);
        if (currentStepToShow >= 0) setActiveStep(currentStepToShow);
        if (currentStepToShow === steps.length - 1) {
          setShowAtLast(true);
        } else {
          setShowAtLast(false);
        }
      }
    }
  }, [steps]);

  const fetchContactData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`/${contactApi}/${id}`)
      .then(({ data: { data } }) => {
        handleMainPoints(data);
        let name = [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' ');

        if (data?.salutation?.optionLabel) {
          name = data.salutation.optionLabel + name;
        }
        setHeadingLbl(name);
        handleAllowToEditList(data);
        setContactData(data);
        getContactFields();
        setTypeCreateProjectSalesDialog([
          { id: id, type: contactResource },
          { id: data?.accountName?.optionValue, type: accountResource }
        ]);
        setCanEdit([...(data?.collaborator ?? []), data?.owner].some((obj) => obj.optionValue === user.user._id));

        setCustomizedRoutes([contactBreadcrumb, { title: [data.firstName, data.lastName].filter((d) => d).join(' ') }]);

        let orgChartData = [];

        if (data.parentHierarchy && data.parentHierarchy.length > 0) {
          data.parentHierarchy.map((d) => {
            orgChartData.push({
              id: d._id,
              name: [d.firstName, d.middleName, d.lastName].filter((d) => d).join(' '),
              parentId: d.reportsTo ? d.reportsTo : 0,
              logo: d.contactLogo,
              email: d.email,
              phone: d.phone,
              current: false
            });
          });
        }

        orgChartData.push({
          id: data._id,
          name: [data.firstName, data.middleName, data.lastName].filter((d) => d).join(' '),
          parentId: data.reportsTo ? data.reportsTo.optionValue : 0,
          logo: data.contactLogo,
          email: data.email,
          phone: data.phone,
          current: true
        });

        setOrgChartData(orgChartData);
      })
      .catch((err) => {
        setLoading(false);
      });
  };

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`/${contactApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setOpportunities(
          data.Opportunity && data.Opportunity[sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data.Opportunity[sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );

        setProjectSales(
          data[sidebarResource.projectSales] && data[sidebarResource.projectSales][sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data[sidebarResource.projectSales][sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );

        setQuotes(
          data[sidebarResource.quoteBuilder] && data[sidebarResource.quoteBuilder][sidebarResource[contactResource].replaceAll(' ', '_')]
            ? data[sidebarResource.quoteBuilder][sidebarResource[contactResource].replaceAll(' ', '_')]
            : []
        );
      });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: 'Org Chart',
      onClick: () => {
        setOrgChartInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      // icon: <TiFlowChildren />,
      show: true,
      class: 'account'
    }
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
      phone: data.phone || '',
      email: data.email || '',
      title: data.title || ''
    };
    if (data?.accountName?.optionLabel) {
      tempMp['Account Name'] = data.accountName.optionLabel;
    }

    setMainPoints(tempMp);
  };

  const getContactFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource[contactResource]}`)
      .then(({ data: { data } }) => {
        setContactFields(data.filter((d) => d.isUpdate || d.isRead));
        setLoading(false);
        const processSteps = data.find((d) => d.isRead && d.fieldData.type.toLowerCase() === 'process');
        if (processSteps && processSteps.isRead) {
          setSteps(
            processSteps.fieldData.option.map((m) => {
              return {
                text: m.optionLabel,
                canCompleteManually: true
              };
            })
          );
          setShowAdditionalField(processSteps.fieldData.showAdditionalInfoPopup);
        }
        data.map((d) => {
          if (d.fieldData.sectionName === processSteps?.fieldData.additionalInfoSection && sectionFields.length === 0) {
            setSectionFields((prevItems) => {
              return [...prevItems, d];
            });
            setAdditionalFieldName(d.fieldData.sectionName);
          }
        });
      });
  };

  const handleDeleteContact = () => {
    if (contactData?._id) {
      axiosInstance()
        .put(`/${contactApi}/remove`, { ids: [contactData._id] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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
    history.push(`/${contactRoute}`);
  };

  const handleAllowToEditList = (contactDetails) => {
    const userId = user?.user?._id;
    let allowToEdit = false;

    if (userId) {
      allowToEdit = contactDetails.owner?.optionValue && contactDetails.owner.optionValue === userId;

      if (!allowToEdit && contactDetails.collaborator && contactDetails.collaborator.length > 0) {
        allowToEdit = contactDetails.collaborator.findIndex((d) => d?.optionValue === userId) > -1;
      }

      if (allowToEdit) setAllowedToEdit(allowToEdit);
    }
  };

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  const handleOpneUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true);
    }
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleSave = (data) => {
    setShowAtLast(true);
    setOpenAdditionalDialog(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    let processFieldName = '';
    const contactFieldData = contactFields.map((f) => {
      if (f.fieldData.type === 'process') {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });

    const updatedContactData = {
      ...contactData,
      ...data
    };

    const updatedData = {
      ...getObjKeysWithValues(updatedContactData, contactFieldData),
      [processFieldName]: steps[tempActiveStep].text,
      _id: contactData._id
    };

    axiosInstance()
      .put(`${contactApi}`, updatedData)
      .then(() => {
        fetchContactData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setShowAtLast(false);
    let tempActiveStep = data && data?.isSetBackStep ? activeStep - 1 : activeStep < steps.length - 1 ? activeStep + 1 : activeStep;
    if (tempActiveStep === steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = '';
      const contactFieldData = contactFields.map((f) => {
        if (f.fieldData.type === 'process') {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });

      const updatedData = {
        ...getObjKeysWithValues(contactData, contactFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: contactData._id
      };

      axiosInstance()
        .put(`${contactApi}`, updatedData)
        .then(() => {
          fetchContactData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleUpdateContact = (values) => {
    if (values.employees) {
      values.employees = parseInt(values.employees);
    }
    const updatedData = {
      ...values,
      _id: contactData._id
    };

    axiosInstance()
      .put(`/${contactApi}`, updatedData)
      .then(({ data }) => {
        fetchContactData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setOpenUpdateDialog(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  }

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  }

  let filteredContactFields = contactFields.filter((item) => item.fieldData.sectionName != additionalFieldName);
  return (
    <>
      {openUpdateDialog && showAtLast ? (
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
          contactData={{
            fields: contactFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              contactData,
              contactFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={handleUpdateContact}
          contactId={contactData._id}
          account={props?.account}
          // contactResource={contactResource}
          accountResource={accountResource}
          contactResource={contactResource}
        // contactApi={contactApi}
        />
      ) : openUpdateDialog ? (
        <ManageContact
          isNew={false}
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          contactData={{
            fields: filteredContactFields.map((f) => {
              return f.fieldData;
            }),
            initialValues: getObjKeysWithValues(
              contactData,
              filteredContactFields.map((f) => {
                return f.fieldData;
              })
            )
          }}
          loading={loading}
          handleSubmit={handleUpdateContact}
          contactId={contactData._id}
          account={props?.account}
          // contactResource={contactResource}
          accountResource={accountResource}
          contactResource={contactResource}
        // contactApi={contactApi}
        />
      ) : null}

      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
        <div>
          <Paper>
            <DetailsPageHeader
              heading={headingLbl}
              logo={contactData?.contactLogo ? contactData.contactLogo : undefined}
              mainPoints={mainPoints}
              // style={{ marginTop: "150px", minHeight: "200px" }}
              showHeading={true}
            >
              {contactPermissions.isUpdate && canEdit ? (
                <Button variant="contained" color="primary" size="small" onClick={handleOpneUpdateDialog}>
                  Edit
                </Button>
              ) : null}

              {contactPermissions.isDelete &&
                contactData?.owner?.optionValue &&
                user?.user?._id &&
                contactData.owner.optionValue === user.user._id ? (
                <DeleteButton text="Delete" size="small" onClick={() => setShowConfirmBox(true)} />
              ) : null}
            </DetailsPageHeader>
            <ProcessFlow
              disableBackNext={contactPermissions.isUpdate && canEdit ? false : true}
              steps={steps}
              activeStep={activeStep}
              handleMarkAsCompleted={handleMarkAsCompleted}
            />
            <Box>
              {loading ? (
                <Grid container spacing={2}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <Grid item sm={6} md={6}>
                      <Skeleton variant="text" width="100px" height="16px" />
                      <Box marginY={1} />
                      <Skeleton width="100%" height="50px" />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <>
                  <Tabs
                    className="oms-tab"
                    value={currentTabIndex}
                    onChange={(index, newValue) => {
                      setCurrentTabIndex(newValue);
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                    aria-label="icon tabs example"
                  >
                    <Tab label="Details" aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                    <Tab label="Org Chart" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
                  </Tabs>
                  <Box hidden={currentTabIndex !== 0}>
                    {showAtLast ? (
                      <DetailsPage data={contactData} fields={contactFields} />
                    ) : (
                      <DetailsPage data={contactData} fields={filteredContactFields} />
                    )}
                    {/* <DetailsPage data={contactData} fields={contactFields} /> */}
                  </Box>
                  <Box hidden={currentTabIndex !== 1}>
                    <OrgChartContainer
                      data={orgChartData}
                      onClick={(id) => {
                        history.push(`/${contactApi}/detail/${id}`);
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
            <div className="p-3">
              {permissions?.opportunity?.isRead && (
                <OpportunityInAccordian
                  opportunityPermissions={permissions.opportunity}
                  opportunities={opportunities}
                  onNewOpportunityAdd={() => {
                    fetchRelatedData();
                  }}
                  accountId={contactData?.accountName?.optionValue}
                  accountName={contactData?.accountName?.optionLabel}
                  recordsPerLine={3}
                  resource={accountResource}
                  isRedirect={false}
                  contactId={id}
                  contactResource={contactResource}
                  isAllowedToUpdate={contactPermissions.isUpdate && canEdit}
                />
              )}
              {permissions?.projectSales?.isRead && accountResource === customerAccount.accountResource && (
                <ProjectInAccordion
                  recordsPerLine={3}
                  projectSales={projectSales}
                  type={typeCreateProjectSalesDialog}
                  fetchData={fetchRelatedData}
                  permissions={permissions}
                  isAddProjectSale={true}
                  isAllowedToEdit={contactPermissions.isUpdate && canEdit}
                />
              )}
              {accountResource === customerAccount.accountResource && permissions?.quoteBuilder?.isRead && (
                <QuotesInAccordion
                  recordsPerLine={3}
                  quotes={quotes}
                  fetchData={fetchRelatedData}
                  quoteBuilderPermission={permissions.quoteBuilder}
                  accountId={contactData?.accountName?.optionValue}
                  contactId={id}
                  accountResource={accountResource}
                  isRenderedInCustomerContact={true}
                  isRenderedFromCustomerAccount={true}
                  isAllowedToUpdate={contactPermissions.isUpdate && canEdit}
                />
              )}
              {/* <ProductBuilderInAccordion recordsPerLine={3} /> */}
              {/* {permissions?.lead?.isRead && contactData.staticData?.lead && (
                  <LeadInAccordion
                    recordsPerLine={3}
                    lead={contactData.staticData.lead} />
                )} */}
            </div>
          </Paper>
        </div>
        <div className="position-relative">
          {showActivity ?
            <Paper>
              {!isMobile && !isTablet && <a color="primary" className="activityHide" onClick={handleActivityHideShow}>
                <IoIosArrowDropright className="icon" />
              </a>}
              {!isObjectEmpty(contactData) && (
                <div>
                  <Activity
                    resourceId={contactData._id}
                    resource={contactRoute}
                    restrictedAddActivities={contactPermissions.isUpdate && canEdit ? [] : ['Attachment', 'Case']}
                    relatedTo={[
                      {
                        type: accountResource,
                        referenceId: contactData?.accountName?.optionValue,
                        access: false
                      },
                      {
                        type: contactResource,
                        referenceId: contactData._id,
                        access: true
                      }
                    ]}
                    handleActivityRefresh={() => { }}
                    emails={[contactData?.email ?? '']}
                  />
                </div>
              )}
              <QuickLinks quickLinks={quickLinks} />
              {contactData?.staticData?.lead && permissions && permissions.lead && permissions.lead.isRead && (
                <Grid item xs={12}>
                  <BoxWithBorder style={{ marginTop: '3%', padding: '0px' }}>
                    <div className={`${contactClass.detail_page_div3}`}>
                      <div className={`${contactClass.leads_data}`}>
                        <Typography color="primary" variant="h6" style={{ margin: '0 10px' }}>
                          Related Lead
                        </Typography>
                      </div>
                      <Box className={`${contactClass.custom_box1}`}>
                        <Card className="contactCard">
                          <CardContent className="detailListing">
                            <List>
                              <ListItem>
                                <ListItemAvatar>
                                  <div
                                    data-initials={[
                                      contactData?.staticData?.lead?.firstName?.charAt(0).toUpperCase(),
                                      contactData?.staticData?.lead?.lastName?.charAt(0).toUpperCase()
                                    ]
                                      .filter((f) => f)
                                      .join('')}
                                  ></div>
                                </ListItemAvatar>
                                <ListItemText
                                  className="ml-2"
                                  primary={
                                    contactData?.staticData?.lead?.entity === selectedEntity ?
                                      <Link className="link f_size p-l2" to={`/lead/detail/${contactData?.staticData?.lead?._id}`}>
                                        {contactData?.staticData?.lead?.concatedName}
                                      </Link>
                                      : hasAccessToEntity(contactData?.staticData?.lead?.entity) ?
                                        <Link
                                          className="link f_size p-l2"
                                          onClick={() => {
                                            handleEntityChange(contactData?.staticData?.lead?.entity)
                                            history.push(`/lead/detail/${contactData?.staticData?.lead?._id}`)
                                          }}>
                                          {contactData?.staticData?.lead?.concatedName}
                                        </Link>
                                        :
                                        <span>
                                          {contactData?.staticData?.lead?.concatedName}
                                        </span>
                                  }
                                  secondary={
                                    <React.Fragment>
                                      <Typography component="p" variant="body2" className="cardDetail">
                                        {contactData?.staticData?.lead?.title && (
                                          <span className="d-flex gap-2 align-items-center">
                                            <FiStar size="15" />
                                            {contactData?.staticData?.lead?.title}
                                          </span>
                                        )}
                                        {contactData?.staticData?.lead?.email && (
                                          <span className="d-flex gap-2 align-items-center">
                                            <AiOutlineMail size="15" />
                                            {contactData?.staticData?.lead?.email}
                                          </span>
                                        )}
                                        {contactData?.staticData?.lead?.phone && (
                                          <span className="d-flex gap-2 align-items-center">
                                            <BiPhone size="15" />
                                            {contactData?.staticData?.lead?.phone}
                                          </span>
                                        )}
                                      </Typography>
                                    </React.Fragment>
                                  }
                                />
                              </ListItem>
                            </List>
                          </CardContent>
                        </Card>
                        {/* <Card>
                            <CardContent className="detailListing">
                              <Grid container className="detailCardHeader">
                                <Grid item xs={12} sm={12}>
                                  <Link className="link f_size"
                                    to={`/lead/detail/${contactData?.staticData?.lead?._id}`}>
                                    {contactData?.staticData?.lead?.firstName || ''} {contactData?.staticData?.lead?.lastName || ''}
                                  </Link>
                                </Grid>
                              </Grid>
                              <Grid container>
                                <Grid item xs={12} sm={6}>
                                  <DisplayData label='Title' value={contactData?.staticData?.lead?.title || '-'} icon={< BiFace size={20} />} />
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card> */}
                      </Box>
                    </div>
                  </BoxWithBorder>
                </Grid>
              )}
            </Paper> :
            !isMobile && !isTablet && <a className="activityShow" onClick={handleActivityHideShow}>
              <IoIosArrowDropleft className="icon" />
            </a>}
        </div>
      </div>
      {showConfirmBox ? (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Contact ?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteContact}
        />
      ) : null}

      {orgChartInFullScreenDialog && (
        <FullScreenDialog
          heading="Org Chart"
          open={orgChartInFullScreenDialog}
          close={() => {
            setOrgChartInFullScreenDialog(false);
          }}
        >
          <OrgChartContainer
            data={orgChartData}
            onClick={(id) => {
              setOrgChartInFullScreenDialog(false);
              history.push(`/${contactApi}/detail/${id}`);
            }}
          />
        </FullScreenDialog>
      )}
      {openAdditionalDialog && (
        // <Dialog
        //   disableBackdropClick={true}
        //   fullWidth
        //   maxWidth="sm"
        //   open={openAdditionalDialog}
        //   onClose={() => setOpenAdditionalDialog(false)}
        //   aria-labelledby="form-dialog-title"
        //   fullScreen={isMobile || isTablet}
        // >
        //   <CustomDialogHeader
        //     title="Additonal Information"
        //     onClose={() => setOpenAdditionalDialog(false)}
        //   ></CustomDialogHeader>
        //   {sectionFields.map((item) => (
        //     <CustomDialogContent>{item}</CustomDialogContent>
        //   ))}

        //   <CustomDialogFooter>
        //     <Button
        //       color="primary"
        //       size="small"
        //       onClick={() => setOpenAdditionalDialog(false)}
        //     >
        //       Close
        //     </Button>
        //     <Button color="primary" size="small" onClick={handleSave}>
        //       Save
        //     </Button>
        //   </CustomDialogFooter>
        // </Dialog>
        <AdditionalDialogPopUp
          open={openAdditionalDialog}
          close={() => setOpenAdditionalDialog(false)}
          handleSave={handleSave}
          title="Additional Information"
          fieldData={sectionFields}
        />
      )}
    </>
  );
};

export default ContactDetailsPage;

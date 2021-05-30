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
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ManageQuoteDialog from "./ManageQuote/ManageQuoteDialog";

import _ from "lodash";
import {
  customerAccount, supplierAccount, yyyyMMDD,
  stepsToIgnoreManualCompleteForOpportunity, supplierContact, customerContact,
  getObjKeysWithValues, opportunityProcessFieldName, formatAmountWithCurrency
} from "../../constants/helpers";
import { quoteBuilder } from '../../constants/helpers'
import CustomSteps from "../../components/CustomSteps/CustomSteps";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { BsCheckAll } from "react-icons/bs";
import ProductBuilder from "../../components/productBuilder";

const recordsPerLine = 3;
function QuoteDetail() {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState("");
  const [loading, setLoading] = useState(true);
  const [quoteData, setquoteData] = useState(null);
  const [copyOfquoteDataToUpdate, setCopyOfquoteDataToUpdate] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [quoteFields, setquoteFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentTabIndex] = useState(0);

  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0)
  const [versions,setVersions]=useState([])
  const [productBuilderID,setProductBuilderID]=useState("");
  

  const [supplierContacts, setSupplierContacts] = useState([])
  const [customerContacts, setCustomerContacts] = useState([])
  const [showAddSupplierContactsDialog, setShowAddSupplierContactsDialog] = useState(false)
  const [showAddCustomerContactsDialog, setShowAddCustomerContactsDialog] = useState(false)

  const [isProcessing, setIsProcessing] = useState(false)
  const [currentVersion,setCurrentVersion]=useState(0);

  const [messageDialog, setMessageDialog] = useState({ open: false, message: null })
  const [expanded, setExpanded] = useState({
    supplierContacts: true,
    customerContacts: true
  })
  const [supplierAccountOptions, setSupplierAccountOptions] = useState([])
  const [loadingSupplierAccounts, setLoadingSupplierAccounts] = useState(false);
  const [contactsEmailsData, setContactsEmailsData] = useState([])
  const [notToBeRemovedContacts, setNotToBeRemovedContacts] = useState([])
  const [PBstatus,setPBStatus]=useState("")
  const [loadPB,setLoadPB]=useState(false);

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  // const closeUpdateDialog = () => {
  //   setOpenUpdateDialog(false);
  // };

  let { id } = useParams();

  const [quotePermissions, setquotePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const { qbResource, qbApi } = quoteBuilder;

  useEffect(() => {
    if (permissions) {
      setquotePermissions(permissions[qbResource]);
    }
  }, [permissions]);

  useEffect(() => {
    if (id) {
      fetchquoteData(0);
    }
  }, [id]);

  useEffect(() => {
    if (quoteData?.staticData?.customerContacts &&
      quoteData.staticData?.customerContacts.length &&
      customerContacts && customerContacts.length === 0) fetchCustomerContactData(false)

    if (quoteData?.staticData?.supplierContacts &&
      quoteData.staticData?.supplierContacts.length &&
      supplierContacts && supplierContacts.length === 0) fetchSupplierContactData(false)

  }, [quoteData])

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = quoteFields.find(d => d.isRead && d.fieldData.fieldName.toLowerCase() === opportunityProcessFieldName.toLowerCase());
      if (processSteps && processSteps.isRead && quoteData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex(d => d.optionLabel === quoteData[opportunityProcessFieldName]) + 1;
        setActiveStep(currentStepToShow);
      }
    }
  }, [steps])



  const fetchquoteData = (version) => {
    if (selectedEntity) {
        setLoadPB(false);
      setLoading(true);
      axiosInstance()
        .get(`${qbApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          handleMainPoints(data);
          setHeadingLbl(data.quoteName);
          var keys=Object.keys(data.versions);
          setVersions(keys);
          if(version===0){
            setCurrentVersion(parseInt(keys[keys.length-1]));
          }
          else{
            setCurrentVersion(version);
          }
          setProductBuilderID(data.versions[keys[keys.length-1]]["productBuilderId"]);
          setPBStatus(data.versions[keys[keys.length-1]]["status"]);
          setAllowedToEdit([...data.collaborator ?? [], data.owner].some(
            (d) => d?.optionValue === user?.user?._id
          ))

          // handleAllowToEditList(data);
          setCopyOfquoteDataToUpdate(data);
          handleContactsEmails(data)

          if (data?.staticData?.notToBeRemoved && typeof data.staticData.notToBeRemoved === 'object') {
            let ids = []
            Object.keys(data?.staticData?.notToBeRemoved).map(k =>
              ids = [...ids, ...data.staticData.notToBeRemoved[k]]
            )
            setNotToBeRemovedContacts(ids)
          }

          let modifiedData = {};
          Object.assign(modifiedData, data);

          // if (modifiedData["currency"] && modifiedData["amount"]) {
          modifiedData["amount"] = formatAmountWithCurrency(modifiedData["currency"], modifiedData["amount"])
          // const currency = currencies.find(d => d.currencyCode == modifiedData["currency"])?.symbolNative;
          // modifiedData["amount"] = [currency, modifiedData["amount"]].filter(d => d).join(" ");
          // }

          setquoteData(modifiedData);

          let tempExpanded = {
            supplierContacts: true,
            customerContacts: true
          }
          if (data?.staticData?.supplierContacts && data.staticData.supplierContacts.length === 0) {
            tempExpanded.supplierContacts = false
          }
          if (data?.staticData?.customerContacts && data.staticData.customerContacts.length === 0) {
            tempExpanded.customerContacts = false
          }
          setExpanded(tempExpanded)

          getquoteFields();
          setCustomizedRoutes([
            {title:"Quote Builder", path:"/quote-builder"},
            { title: `${data.quoteName}` },
          ]);
          
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  }

  const fetchSupplierContactData = (showDialog, useAccountList = false, accountList = []) => {
    let ids = []

    if (quoteData.supplierAccountName.length > 0 || useAccountList) {

      ids = useAccountList ? accountList.map(d => d.optionValue) : quoteData.supplierAccountName.map(d => d.optionValue);

      const filterById = JSON.stringify([{ "field": "accountName", "term": ids.length > 1 ? { $in: ids } : ids[0] }])
      setLoadingSupplierAccounts(true)
      axiosInstance()
        .get(`supplier-contact?filterById=${filterById}`)
        .then(({ data: { data } }) => {

          let assignedContacts = quoteData.staticData?.supplierContacts ?? []
          const updatedContacts = [];
          data.forEach(d => {
            d["isChecked"] = assignedContacts.length > 0 ? assignedContacts.some(item => item?._id === d?._id) : false;
            updatedContacts.push(d);
          })

          setSupplierContacts(updatedContacts)
          setLoadingSupplierAccounts(false)
          if (!useAccountList) setShowAddSupplierContactsDialog(showDialog);
        }).catch(error => {
          setLoadingSupplierAccounts(false)
        })
    }
    else {
      setShowAddSupplierContactsDialog(showDialog);
    }
    // else if (supplierAccountOptions && supplierAccountOptions.length) {
    //   ids = [...supplierAccountOptions.map(option => option.optionValue)]
    // }
  }
  const getContactEmails = (contacts) => {
    return contacts.reduce((emails, contact) => {
      if (contact?.email) emails.push(contact.email)
      return emails
    }, [])
  }
  const handleContactsEmails = (quoteData) => {
    let data = []
    if (quoteData && quoteData?.staticData) {
      const { customerContacts, supplierContacts } = quoteData?.staticData
      if (customerContacts && customerContacts.length) {
        data = getContactEmails(customerContacts)
      }
      if (supplierContacts && supplierContacts.length) {
        data = [...data, ...getContactEmails(supplierContacts)]
      }
      if (data.length > 0) setContactsEmailsData(data)
    }
  }

  const handleContactSelection = (e, id) => {
    const indexOfContactToChange = supplierContacts.findIndex(d => d._id === id);
    supplierContacts[indexOfContactToChange].isChecked = e.target.checked;
    setSupplierContacts([...supplierContacts]);
  };

  const fetchCustomerContactData = (showDialog) => {
    const filterById = JSON.stringify([{ "field": "accountName", "term": quoteData?.customerAccountName?.optionValue }])

    axiosInstance()
      .get(`customer-contact?filterById=${filterById}`)
      .then(({ data: { data } }) => {
        let assignedContacts = quoteData.staticData?.customerContacts ?? []
        const updatedContacts = data.map(d => {
          d["isChecked"] = assignedContacts.length > 0 ? assignedContacts.some(item => item?._id === d?._id) : false;
          return d
        })
        setCustomerContacts(updatedContacts)
        setShowAddCustomerContactsDialog(showDialog);
      });
  }

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint["Account Name"] = data?.accountName?.optionLabel || "";
    mainPoint["Close Date"] = yyyyMMDD(data.closeDate);
    mainPoint["Amount"] = data?.amount ? formatAmountWithCurrency(data?.currency, data?.amount) : "";
    mainPoint["Quote Owner"] = data?.owner?.optionLabel || "";

    setMainPoints(mainPoint);
  };

  const getquoteFields = () => {
    if (selectedEntity) {
      axiosInstance()
        .get(`/field?resource=Quote Builder&entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setquoteFields(data);
          setLoading(false);
          setLoadPB(true);

          if (data && data.length) {
            let fieldData = data.find(currentField => currentField?.fieldData?.fieldName === "supplierAccountName")?.fieldData
            if (fieldData?.option && fieldData.option.length) {
              setSupplierAccountOptions(fieldData.option.map(option => ({ ...option, isSelected: false })))
            }
          }
          const processSteps = data.find(d => d.isRead && d.fieldData.fieldName.toLowerCase() === opportunityProcessFieldName.toLowerCase());
          if (processSteps && processSteps.isRead) {
            setSteps(processSteps.fieldData.option.map(m => {
              return {
                text: m.optionLabel,
                canCompleteManually: !stepsToIgnoreManualCompleteForOpportunity.some(s => s === m.optionValue.toLowerCase())
              }
            }));
          }
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleDeleteOpportunity = () => {
    if (quoteData?._id) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
          ids: [quoteData._id],
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


  const handleChangeVersion=(event)=>{
    setLoadPB(false)
    setCurrentVersion(event.target.value);
    setProductBuilderID(quoteData["versions"][event.target.value]["productBuilderId"]);
    setPBStatus(quoteData["versions"][event.target.value]["status"]);
    console.log(quoteData["versions"][event.target.value]["productBuilderId"])
    setLoadPB(true);
  }
  // const quickLinks = [
  //   {
  //     label: "Call a log",
  //     count: 0,
  //   },
  //   {
  //     label: "New Task",
  //     count: 0,
  //   },
  //   {
  //     label: "Email",
  //     count: 0,
  //   },
  //   {
  //     label: "New Event",
  //     count: 0,
  //   },
  // ];


  const handleClone=()=>{
    axiosInstance()
    .post(`${qbApi}/clone/${quoteData._id}`)
    .then(({ data }) => {
        history.push(`${qbApi}/${data.data._id}`);
    })
    .catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const handleUpdateOpportunity = (supplierAccounts) => {

    let newFields = [];

    quoteFields.filter((d) => d.isUpdate).map((_f) => newFields.push(_f.fieldData));

    let values = {
      ...getObjKeysWithValues(quoteData, newFields),
      supplierAccountName: supplierAccounts,
      _id: quoteData._id
    }

    axiosInstance()
      .put(`${qbApi}?entity=${selectedEntity}`, values)
      .then(({ data }) => {
        fetchquoteData(0)
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  let selectedSupplierAccounts = []
  if (quoteData?.supplierAccountName && quoteData.supplierAccountName.length) {
    selectedSupplierAccounts = quoteData.supplierAccountName.map(s => s.optionValue)
  }

  return (
    <>
      <Layout>
        <Grid container direction="row">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <Paper className="subContainer">
              {!quoteData ? (
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
                    quoteData?.leadLogo ? quoteData.leadLogo : undefined
                  }
                  mainPoints={mainPoints}
                  showHeading={true}
                >
                    {quotePermissions.isCreate ?(
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleClone}
                    >
                      Clone
                    </Button>
                    ):null}
                  {allowedToEdit ? (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      Edit
                    </Button>

                  ) : null}
                  {quotePermissions.isDelete &&
                    quoteData?.owner.optionValue &&
                    user?.user?._id &&
                    quoteData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                  
                </DetailsPageHeader>
              )}

              {
                steps.length > 0 &&
                <div className="stepper-box">
                  <div className="mainview">
                    <CustomSteps steps={steps} active={activeStep} />
                  </div>
                  <div className="actionview">
                    <div className="d-flex justify-content-center">
                      {
                        activeStep !== steps.length ?
                          isProcessing ? <Button variant="contained"
                            color="primary"
                            size="small"
                            disabled={true}
                            onClick={() => { }}>
                            Processing...
                    </Button> :
                            <Button variant="contained"
                              color="primary"
                              size="small"
                              disabled={!steps[activeStep].canCompleteManually}
                              onClick={() => {
                                setIsProcessing(true)
                                const updatedData = {
                                  ...getObjKeysWithValues(quoteData, quoteFields.map((f) => { return f.fieldData })),
                                  process: steps[activeStep].text,
                                  _id: quoteData._id
                                };

                                axiosInstance().put(`/opportunity?entity=${selectedEntity}`, updatedData).then(() => {
                                  setActiveStep(activeStep + 1)
                                  setIsProcessing(false)
                                }).catch((error) => {
                                  toastConfig.setToastConfig(error);
                                  setIsProcessing(false)
                                })
                              }}>
                              <BsCheckAll />&nbsp; Mark {steps[activeStep].text} as Completed
                  </Button> : ""
                      }
                    </div>
                  </div>
                </div>
              }

                    
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
                        data={quoteData}
                        fields={quoteFields}
                      />
                    </Box>
                    <div className="p-3">
                      
                    </div>
                  </TabPanel>
                  <TabPanel value={currentTabIndex} index={1}>
                    <Activity />
                  </TabPanel>
                </>
              )}
              <Grid>
              <select className="customSelect" value={currentVersion} 
                                        onChange={handleChangeVersion}>
                                        {versions.map((team) => <option key={team} value={team}>{"Version : " + team}</option>)}
            </select>
            {loadPB?(<ProductBuilder
                productBuilderId={productBuilderID}
                TNC={quoteData["versions"][currentVersion]["TNC"]}
                columnView={quoteData["versions"][currentVersion]["visibleColumns"]}
                status={PBstatus}
                QBId={id}
                currentv={currentVersion}
                Editable={PBstatus==="Building Quote"?true:false}
                Refresh={fetchquoteData}
                
            />):null}
            </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <Paper className="subContainer">
              {!quoteData ? (
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
                        type: quoteData?.customerAccountName ? customerAccount?.accountResource : supplierAccount?.accountResource,
                        referenceId: quoteData?.customerAccountName ? quoteData?.customerAccountName?.optionValue : quoteData?.supplierAccountName?.optionValue,
                        access: false,
                      },
                      {
                        type: "opportunity",
                        referenceId: quoteData?._id,
                        access: true,
                      },
                    ]}
                    handleActivityRefresh={() => { }}
                    emails={contactsEmailsData}
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
              entityData={{ fields: quoteFields.map((f) => { return f.fieldData }), initialValues: getObjKeysWithValues(quoteData, quoteFields.map((f) => { return f.fieldData })) }}
              handleSubmit={handleUpdateOpportunity}
            />
          ): null} */}

        {openUpdateDialog && (
          <ManageQuoteDialog
            open={openUpdateDialog}
            onSuccess={() => {
              setOpenUpdateDialog(false);
              fetchquoteData(currentVersion);
            }}
            onClose={() => {
              setOpenUpdateDialog(false);
            }}
            isNew={false}
            dataToUpdate={copyOfquoteDataToUpdate}
            resource={null}
            isRedirectTodetailPage={false}
          // qbApi={qbApi}
          />
        )}

        


        {
          messageDialog.open && <MessageDialog
            open={messageDialog.open}
            onClose={() => { setMessageDialog({ open: false, message: null }) }}
            message={messageDialog.message}
          />
        }
      </Layout>
    </>
  );
}

export default QuoteDetail;

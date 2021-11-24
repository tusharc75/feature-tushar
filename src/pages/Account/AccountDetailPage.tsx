import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  Paper,
  Card,
  CardContent,
  List,
  useMediaQuery
} from "@material-ui/core";
import { isMobile, isTablet } from "react-device-detect";

import { useHistory, useParams } from "react-router-dom";
import { reverse as _reverse } from "lodash";
import { Alert, Skeleton } from "@material-ui/lab";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { accountPage } from "../../routes/Accounts";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { useData } from "../../StateProvider/Provider";
import DetailsPage from "../../components/Shared/DetailsPage";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import BoxWithBorder from "../../components/BoxWithBorder";
import RelatedContacts from "./RelatedContacts";
import axiosInstance from "./../../axios/axiosInstance";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AccountHierarchy from "./AccountHierarchy";
import Activity from "../../components/Activity";
import ControlPointIcon from "@material-ui/icons/ControlPoint";
import accountClass from "./account.module.scss";
import ManageContactDialog from "../Contact/ManageContact/index";
import DeleteButton from "../../components/Helpers/DeleteButton";
import {
  getObjKeysWithValues,
  isObjectEmpty,
  sidebarResource,
  customerAccount,
  processFieldName,
  defaultActivityShow,
} from "../../constants/helpers";
import ManageAccount from "./ManageAccount/ManageAccount";
import ManageAccountDialog from "./ManageAccount/index"
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import QuickLinks, {
  IQuickLinks,
} from "../../components/QuickLinks/QuickLinks";
import OpportunityInAccordian from "../../components/OpportunityInAccordian/OpportunityInAccordian";
import {
  FcFlowChart,
  FcContacts,
  FcBinoculars,
  FcConferenceCall,
  FcMultipleSmartphones,
  FcMoneyTransfer,
} from "react-icons/fc";
import ManageOpportunityDialog from "../Opportunities/ManageOpportunityDialog/ManageOpportunityDialog";
import ProjectInAccordion from "../../components/ProjectInAccordion/ProjectInAccordion";
import QuotesInAccordion from "../../components/QuotesInAccordion/QuotesInAccordion";
import { Link } from "react-router-dom";
import { BsPerson } from "react-icons/bs";
import ListItem from "@material-ui/core/ListItem/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import { ListItemText } from "@material-ui/core";
import { cloneDeep } from "lodash";
import routes from "./../../components/Helpers/Routes";
import CustomNodalStructure from "../../components/CustomNodalStructure/CustomNodalStructure";
import ProcessFlow from "../../components/ProcessFlow";
import AdditionalDialogPopUp from "../../components/AdditionalDialogPopUp";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import queryString from 'query-string';
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";

function DisplayData({ label, value, icon }) {
  return (
    <div style={{ flexGrow: 1 }}>
      <List>
        <ListItem>
          <ListItemAvatar>{icon}</ListItemAvatar>
          <ListItemText primary={value} secondary={label} />
        </ListItem>
      </List>
    </div>
  );
}

export default function AccountDetailPage(props) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    account: { accountApi, accountResource, accountRoute },
    accountBreadcrumb,
    contact: { contactResource, contactRoute, contactApi },
  } = props;
  const { isOffline, offlineFieldsData, offlineGridData, updateOfflineGridData } = useContext(CustomOfflineContext);

  const {
    state: { user, permissions, selectedEntity, tour }, dispatch
  }: any = useData();
  const isSmallScreen = useMediaQuery('(max-width:1300px)');
  const [headingLbl, setHeadingLbl] = useState("");
  // const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false)
  const [parentId, setParentId] = useState(undefined)
  const [accountData, setAccountData] = useState<any>({});
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [projectSales, setProjectSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showApproveDisapproveConfirmBox, setShowApproveDisapproveConfirmBox] =
    useState(false);
  const [accountFields, setAccountFields] = useState([]);
  const [mainPoints, setMainPoints] = useState({});
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
  const [accountHierarchyData, setAccountHierarchyData] = useState([]);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [relatedContactsLoading, setRelatedContactsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] =
    useState(false);
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [editAccountData, setEditAccountData] = useState<any>({});
  const [showAdditionalField, setShowAdditionalField] = useState(false);
  const [sectionFields, setSectionFields] = useState([]);
  const [openAdditionalDialog, setOpenAdditionalDialog] = useState(false);
  const [showAtLast, setShowAtLast] = useState(false)
  const [deleteAccount, setDeleteAccountId] = useState<any>({})
  const [additionalFieldName, setAdditionalFieldName] = useState("")
  const [showActivity, setActivityShow] = useState(defaultActivityShow);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [
    showAccountHierarchyInFullScreenDialog,
    setShowAccountHierarchyInFullScreenDialog,
  ] = useState(false);
  const [isInOfflineSaveQueue, setIsInOfflineSaveQueue] = useState(false)

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  const [loadingGraphData, setLoadingGraphData] = useState(false);
  const [graphData, setGraphData] = useState({
    edges: [],
    nodes: [],
    colorPalette: null,
  });
  const [formValues, setFormValues] = useState({})

  let filteredAccountFields = accountFields.filter(item => item.fieldData.sectionName != additionalFieldName)
  let { id } = useParams();

  const typeCreateProjectSalesDialog = [
    {
      id: id,
      type: accountResource,
    },
  ];

  useEffect(() => {
    if (deleteAccount && deleteAccount?._id && !showConfirmBox) {
      setShowConfirmBox(true)
    }
  }, [deleteAccount])


  useEffect(() => {
    if (deleteAccount && deleteAccount?._id && !showConfirmBox) {
      setShowConfirmBox(true)
    }
  }, [deleteAccount])


  const [tabValue, setTabValue] = useState(0);
  const handleMainTabChange = (
    event: React.ChangeEvent<{}>,
    newValue: number
  ) => {
    setTabValue(newValue);
  };
  interface TabPanelProps {
    children?: React.ReactNode;
    index: any;
    value: any;
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`main-tabpanel-${index}`}
        aria-labelledby={`main-tab-${index}`}
        {...other}
      >
        {children}
      </div>
    );
  }

  useEffect(() => {
    setShowAccountHierarchyInFullScreenDialog(false);
    setTabValue(0);
    fetchAccountData();
    fetchRelatedData();
  }, [id]);

  useEffect(() => {
    //  When it is nodal structure tab
    initializeGraphData();

    return () => {
      setGraphData({ edges: [], nodes: [], colorPalette: null });
    };
  }, [tabValue]);

  useEffect(() => {
    if (isSmallScreen) {
      setActivityShow(true)
    }
  }, [isSmallScreen])

  useEffect(() => {

    if (tour.start && tour.path === "/customer-account/detail"
      || tour.path === "/supplier-account/detail") {
      if (tour.stepIndex === 6) {
        setTabValue(0)
      } else if (tour.stepIndex === 7) {
        setTabValue(1)
      } else if (tour.stepIndex === 8) {
        setTabValue(2)
      }
    }

  }, [tour])

  useEffect(() => {
    if (steps.length > 0) {
      const processSteps = accountFields.find(
        (d) =>
          d.isRead &&
          d.fieldData.fieldName.toLowerCase() === processFieldName.toLowerCase()
      );
      if (processSteps && processSteps.isRead && accountData) {
        const currentStepToShow = processSteps.fieldData.option.findIndex(
          (d) => d.optionLabel === accountData[processFieldName]
        );
        if (currentStepToShow >= 0) setActiveStep(currentStepToShow);
        if (currentStepToShow == steps.length - 1) {
          setShowAtLast(true)
          setFormValues(getObjKeysWithValues(
            accountData,
            filteredAccountFields.map((f) => {
              return f.fieldData;
            })
          ))
        }
        else {
          setShowAtLast(false)
        }
      }
    }
  }, [steps]);

  const initializeGraphData = () => {
    if (tabValue === 2) {
      setLoadingGraphData(true);
      setGraphData({ nodes: [], edges: [], colorPalette: null });

      axiosInstance()
        .get(`${accountApi}/nodal-structure/${id}`)
        .then(({ data }) => {
          setLoadingGraphData(false);
          setGraphData({
            nodes: [...data.data.nodes],
            edges: [...data.data.edges],
            colorPalette: data.colorPalette,
          });
        })
        .catch((error) => {
          setLoadingGraphData(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const fetchRelatedData = () => {
    axiosInstance()
      .get(`/${accountApi}/related/${id}`)
      .then(({ data: { data } }) => {
        setRelatedContacts(
          data[sidebarResource[contactResource]] &&
            data[sidebarResource[contactResource]]["Account_Name"]
            ? data[sidebarResource[contactResource]]["Account_Name"]
            : []
        );
        setOpportunities(
          data.Opportunity &&
            data.Opportunity[
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            ? data.Opportunity[
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            : []
        );
        setProjectSales(
          data[sidebarResource.projectSales] &&
            data[sidebarResource.projectSales][
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            ? data[sidebarResource.projectSales][
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            : []
        );
        setQuotes(
          data[sidebarResource.quoteBuilder] &&
            data[sidebarResource.quoteBuilder][
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            ? data[sidebarResource.quoteBuilder][
            sidebarResource[accountResource].replaceAll(" ", "_")
            ]
            : []
        );
        initializeGraphData();
        setRelatedContactsLoading(false);
      });
  };

  const fetchAccountData = async () => {
    setLoading(true);

    let data;

    if (!isOffline) {
      const response: any = await axiosInstance().get(`/${accountApi}/${id}`);
      data = response?.data?.data;
    } else {
      data = offlineGridData ? offlineGridData[accountResource]?.find(d => d._id === id) : null
    }

    if (localStorage.getItem("offlineDataToSave")) {
      const offlineDataToSave = JSON.parse(localStorage.getItem("offlineDataToSave"))
      if (offlineDataToSave[accountResource]) {
        setIsInOfflineSaveQueue(offlineDataToSave[accountResource]?.some(d => d.values._id === id));
      }
    }

    try {
      updateOfflineGridData(accountResource, [data], []);
    } catch (ex) {
      console.error(`${accountResource}: Error while adding/updating data for Offline context. Error: ${ex.message}`)
    }

    setCustomizedRoutes([accountBreadcrumb, { title: data.accountName }]);
    setHeadingLbl(data.accountName || "");
    handleMainPonts(data);
    setAccountData(data);
    setCanEdit(
      [...(data?.collaborator ?? []), data?.owner].some(
        (obj) => obj.optionValue === user.user._id
      )
    );

    let parentHierarchyData = []
    if (data.parentHierarchy && data.parentHierarchy.length > 0) {
      data.parentHierarchy.map(o => {
        if (Object.keys(o).length) {
          if (typeof o.owner === "string") {
            o.owner = {
              optionValue: o.owner,
              optionLabel: o.owner
            }
          }
          o.canEdit = [...(data?.collaborator ?? []), o.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
          parentHierarchyData.push(o)
        }
      })
    }
    if (parentHierarchyData && parentHierarchyData.length > 0) {
      let accounts = [
        ...data.parentHierarchy,
        {
          _id: data._id,
          accountName: data.accountName,
          typeOfAccount: data.typeOfAccount,
          industry: data.industry,
          typeOfBusiness: data.typeOfBusiness,
          phone: data.phone,
          type: "child",
          current: true,
          parentAccount: data.parentAccount
            ? {
              _id: data.parentAccount.optionValue,
              accountName: data.parentAccount.optionLabel,
            }
            : null,
          canEdit: [...(data?.collaborator ?? []), data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
          // parentAccountName: data.parentAccount?.optionLabel,
          // parentAccount: data.parentAccount?.optionValue
        },
      ];
      let newData = [];

      accounts.forEach((account) => {
        if (isObjectEmpty(account)) return true;

        const updatedAccount = {
          _id: account._id,
          accountName: account.accountName,
          typeOfAccount: account.typeOfAccount,
          industry: account.industry,
          typeOfBusiness: account.typeOfBusiness,
          phone: account.phone,
          type: "child",
          current: account.current,
          canEdit: account?.canEdit ?? [...(data?.collaborator ?? []), data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
        };

        if (account.parentAccount) {
          updatedAccount["parentAccountText"] =
            account.parentAccount.accountName;
          updatedAccount["parentAccountId"] = account.parentAccount._id;
        } else {
          updatedAccount["type"] = "parent";
        }
        // if (isAllowedToEdit && openEdit === 'true') {
        //   setOpenUpdateDialog(true);
        //   const params = new URLSearchParams();
        //   params.delete('openEdit');
        //   history.push({ search: params.toString() });
        // }
        newData.push(updatedAccount);
      });

      setAccountHierarchyData([...newData]);
    } else {
      setAccountHierarchyData([
        {
          _id: data._id,
          accountName: data.accountName,
          typeOfAccount: data.typeOfAccount,
          industry: data.industry,
          typeOfBusiness: data.typeOfBusiness,
          phone: data.phone,
          current: true,
          canEdit: [...(data?.collaborator ?? []), data?.owner].some(
            (obj) => obj.optionValue === user.user._id
          )
        },
      ]);
    }

    // if (accountFields.length === 0) {
    //   getAccountFields();
    // } else {
    //   setLoading(false);
    // }
    getAccountFields(data);
    setLoading(false);
    initializeGraphData();

  };

  const handleMainPonts = (data) => {
    let mainPoints = {
      Phone: data.phone || "",
    };
    if (data?.parentAccount?.optionLabel) {
      mainPoints["Parent Account"] = data.parentAccount.optionLabel;
    }
    if (data?.owner?.optionLabel) {
      mainPoints["Primary Owner"] = data.owner.optionLabel;
    }
    setMainPoints(mainPoints);
  };

  const getAccountFields = async (accountData = {}) => {

    let data;
    if (!isOffline) {
      const response: any = await axiosInstance().get(`/field?resource=${sidebarResource[accountResource]}`)
      data = response?.data?.data
    } else {
      data = offlineFieldsData[accountResource];
    }

    setAccountFields(data.filter((d) => d.isUpdate || d.isRead));
    setFormValues(getObjKeysWithValues(
      accountData,
      data.map((f) => {
        return f.fieldData;
      })
    ))

    setLoading(false);

    const processSteps = data.find(
      (d) => d.isRead && d.fieldData.type.toLowerCase() === "process"
    );

    if (processSteps && processSteps.isRead) {
      setSteps(
        processSteps.fieldData.option.map((m) => {
          return {
            text: m.optionLabel,
            canCompleteManually: true,
          };
        })
      );
      setShowAdditionalField(
        processSteps.fieldData.showAdditionalInfoPopup
      );
    }

    data.map((d) => {
      if (
        d.fieldData.sectionName ==
        processSteps?.fieldData.additionalInfoSection &&
        sectionFields.length == 0
      ) {
        setSectionFields((prevItems) => {
          return [...prevItems, d];
        });
        setAdditionalFieldName(d.fieldData.sectionName)
      }
    });
  };

  const quickLinks: IQuickLinks[] = [
    {
      label: "Account Hierarchy",
      onClick: () => {
        setShowAccountHierarchyInFullScreenDialog(true);
      },
      icon: <FcFlowChart />,
      // icon: <TiFlowChildren />,
      show: true,
      class: "account",
    },
    {
      label: "Projects",
      count: 0,
      show: true,
      icon: <FcMultipleSmartphones />,
      class: "project",
    },
    {
      label: "Opportunity",
      count: opportunities ? opportunities.length : 0,
      show: permissions?.opportunity?.isRead ?? false,
      icon: <FcBinoculars />,
      class: "opportunity",
      onClick: () => {
        history.push({
          pathname: `/opportunity`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
            resource: accountResource,
          },
        });
      },
    },
    {
      label: "Quotes",
      count: 0,
      show: true,
      icon: <FcMoneyTransfer />,
      class: "quotes",
    },
    {
      label: "Accounts Teams",
      count: 0,
      show: true,
      icon: <FcConferenceCall />,
      class: "teams",
    },
    {
      label: "Contacts",
      count: relatedContacts ? relatedContacts.length : 0,
      icon: <FcContacts />,
      class: "contact",
      onClick: () => {
        history.push({
          pathname: `/${contactRoute}`,
          state: {
            accountId: accountData._id,
            accountName: accountData.accountName,
          },
        });
      },
      show:
        permissions && permissions[contactResource]
          ? permissions[contactResource].isRead
          : false,
    },
  ].filter((d) => d.show);

  const handleDeleteAcc = () => {
    let deleteId = deleteAccount && deleteAccount?._id ? deleteAccount._id : accountData?._id
    if (deleteId) {
      axiosInstance()
        .put(`/${accountApi}/remove`, { ids: [deleteId] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setDeleteAccountId({})
          let fetchData = deleteAccount && deleteAccount?._id && deleteAccount?._id !== accountData?._id
          if (fetchData) {
            fetchAccountData()
          }
          else {
            goBackToListing();
          }
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

  const handleApproveDisapprove = () => {
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: [accountData._id],
        approved: !accountData.staticData?.approved,
      })
      .then(() => {
        fetchAccountData();
        setShowApproveDisapproveConfirmBox(false);
      })
      .catch(() => {
        setShowApproveDisapproveConfirmBox(false);
      });
  };

  const onUpdateAccount = (values) => {
    setLoading(true);

    let updatedData = {
      ...values
    }
    if (editAccountData["_id"]) {
      updatedData._id = editAccountData._id
    }
    else {
      updatedData._id = accountData._id
    }

    if (!isOffline) {
      axiosInstance()
        .put(`/${accountApi}`, updatedData)
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setEditAccountData({})
          setLoading(false);
          setOpenUpdateDialog(false);
          fetchAccountData();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    } else {
      let storedData = {};

      if (localStorage.getItem("offlineDataToSave")) {
        storedData = JSON.parse(localStorage.getItem("offlineDataToSave"));
      }

      const dataToSave = {
        api: `/${accountApi}`,
        method: "put",
        values: updatedData
      };

      if (!storedData[accountResource]) {
        storedData[accountResource] = [];
      }
      storedData[accountResource].push(dataToSave)

      localStorage.setItem("offlineDataToSave", JSON.stringify(storedData));

      setLoading(false);
      toastConfig.setToastConfig({
        open: true,
        type: "info",
        message: "Updates are in offline state, it will be affected once you will be in network",
      });
      setOpenUpdateDialog(false);
    }
  };

  const goBackToListing = () => {
    history.push({
      pathname: accountPage.path,
    });
  };

  const handleOpneUpdateDialog = () => {
    if (activeStep === steps.length - 1) {
      setShowAtLast(true)

    }
    setOpenUpdateDialog(true);
  };

  const closeUpdateDIalog = () => {
    setOpenUpdateDialog(false);
    setEditAccountData({})
  };

  const handleCreateContact = () => {
    setShowCreateContactDialog(true);
  };

  const handleSave = (data) => {
    setIsProcessing(true);
    setShowAtLast(true)
    setOpenAdditionalDialog(false);
    let tempActiveStep =
      data && data?.isSetBackStep
        ? activeStep - 1
        : activeStep < steps.length - 1
          ? activeStep + 1
          : activeStep;

    let processFieldName = "";
    const accountFieldData = accountFields.map((f) => {
      if (f.fieldData.type == "process") {
        processFieldName = f.fieldData.fieldName;
      }
      return f.fieldData;
    });

    const updatedAccountData = {
      ...accountData,
      ...data
    }

    const updatedData = {
      ...getObjKeysWithValues(updatedAccountData, accountFieldData),
      [processFieldName]: steps[tempActiveStep].text,
      _id: accountData._id,
    };

    axiosInstance()
      .put(`${accountApi}`, updatedData)
      .then(() => {
        fetchAccountData();
        // setActiveStep(activeStep + 1)
        setIsProcessing(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsProcessing(false);
      });
  };

  const handleMarkAsCompleted = (data) => {
    setShowAtLast(false)
    setIsProcessing(true);
    let tempActiveStep =
      data && data?.isSetBackStep
        ? activeStep - 1
        : activeStep < steps.length - 1
          ? activeStep + 1
          : activeStep;
    if (tempActiveStep == steps.length - 1 && showAdditionalField) {
      setOpenAdditionalDialog(true);
    } else {
      let processFieldName = "";
      const accountFieldData = accountFields.map((f) => {
        if (f.fieldData.type == "process") {
          processFieldName = f.fieldData.fieldName;
        }
        return f.fieldData;
      });

      const updatedData = {
        ...getObjKeysWithValues(accountData, accountFieldData),
        [processFieldName]: steps[tempActiveStep].text,
        _id: accountData._id,
      };

      axiosInstance()
        .put(`${accountApi}`, updatedData)
        .then(() => {
          fetchAccountData();
          // setActiveStep(activeStep + 1)
          setIsProcessing(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsProcessing(false);
        });
    }

    // if (activeStep === steps.length - 2 && showAdditionalField) {
    //   setOpenAdditionalDialog(true);
    // }
  };

  const handleEntityChange = (id) => {
    dispatch({ type: SET_SELECTED_ENTITY, payload: id });
  }

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  }
  const handleValuesChange = (name, value) => {
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value
    }))
  }
  const handleUpdate = (account) => {
    if (account._id) {
      axiosInstance()
        .get(`/${accountApi}/${account._id}`)
        .then(({ data: { data } }) => {
          setEditAccountData(data);
          setOpenUpdateDialog(true);
        })
    }
  }
  const handleCreateNewAccount = id => {
    setParentId(id)
    setShowCreateAccountDialog(true)
  }

  const tourPaths = ["/customer-account/detail", "/supplier-account/detail"]

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>

      <div
        className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`}
        style={{
          height:
            tour.start && tourPaths.includes(tour.path)
              && tour.stepIndex > 0 && tour.stepIndex < 9
              ? "auto"
              : "calc(100vh - 98px)"
        }}
      >
        <div>
          <Paper>
            {
              <DetailsPageHeader
                loading={loading}
                heading={headingLbl}
                isApproved={accountData?.staticData?.approved}
                mainPoints={mainPoints}
                showHeading={true}
              >
                {
                  !isOffline && permissions &&
                  permissions[accountResource] &&
                  permissions[accountResource].approveAccount && (
                    <>
                      <Button
                        id="detailApproveButton"
                        variant="contained"
                        size="small"
                        color={
                          accountData.staticData?.approved
                            ? "secondary"
                            : "primary"
                        }
                        onClick={() => {
                          setShowApproveDisapproveConfirmBox(true);
                        }}
                      >
                        {accountData.staticData?.approved
                          ? "Disapprove"
                          : "Approve"}
                      </Button>
                    </>
                  )
                }

                {
                  permissions &&
                  permissions[accountResource] &&
                  permissions[accountResource].isUpdate &&
                  canEdit && (
                    <>
                      <Button
                        id="detailEditButton"
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleOpneUpdateDialog}
                      >
                        Edit
                      </Button>
                    </>
                  )
                }

                {
                  !isOffline && permissions &&
                    permissions[accountResource] &&
                    permissions[accountResource].isDelete &&
                    accountData?.owner?.optionValue &&
                    user?.user?._id &&
                    accountData.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      id="detailDeleteButton"
                      text="Delete"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null
                }
              </DetailsPageHeader>
            }
            <ProcessFlow
              disableBackNext={
                permissions &&
                  permissions[accountResource] &&
                  permissions[accountResource].isUpdate &&
                  canEdit
                  ? false
                  : true
              }
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
                    value={tabValue}
                    onChange={handleMainTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    aria-label="icon tabs example"
                    TabIndicatorProps={{
                      style: {
                        height: 0
                      }
                    }}
                  >
                    <Tab
                      label="Details"
                      aria-controls="a11y-tabpanel-0"
                      id="a11y-tab-0"
                    />
                    <Tab
                      label="Account Hierarchy"
                      aria-controls="a11y-tabpanel-1"
                      id="a11y-tab-1"
                    />

                    {
                      !isOffline && <Tab
                        label="OM-Neurons"
                        aria-controls="a11y-tabpanel-2"
                        id="a11y-tab-2"
                      />
                    }
                  </Tabs>
                  <TabPanel value={tabValue} index={0}>
                    <Box>
                      {
                        isInOfflineSaveQueue && <div className="px-3 mt-2">
                          <Alert variant="filled" severity="info">Updates are in offline state, it will be affected once you will be in network</Alert>
                        </div>
                      }

                      {showAtLast ? (<DetailsPage data={accountData} fields={accountFields} />) :
                        <DetailsPage data={accountData} fields={filteredAccountFields} />
                      }
                    </Box>
                  </TabPanel>
                  <TabPanel value={tabValue} index={1} >
                    <Box style={{ overflow: 'auto' }}>
                      <AccountHierarchy
                        data={accountHierarchyData}
                        currentAccountId={accountData._id}
                        accountRoute={accountRoute}
                        handleUpdate={handleUpdate}
                        onCreateNewAccount={handleCreateNewAccount}
                        canUpdate={permissions && permissions[accountResource] && permissions[accountResource].isUpdate}
                        canCreate={permissions && permissions[accountResource] && permissions[accountResource].isCreate}
                        canDelete={permissions && permissions[accountResource] && permissions[accountResource].isDelete}
                        handleDelete={(data) => {
                          setDeleteAccountId(data);
                        }}
                      />
                    </Box>
                  </TabPanel>
                  <TabPanel value={tabValue} index={2}>
                    <Box>
                      <CustomNodalStructure
                        id={id}
                        graphData={graphData}
                        loadingGraphData={loadingGraphData}
                        onClick={(node) => {
                          if (node && routes[node.route]) {
                            history.push({
                              pathname: `${routes[node.route].path}/${node.redirectId}`,
                            });
                          }
                        }}
                      />
                    </Box>
                  </TabPanel>
                  <div className="p-3">
                    {permissions?.opportunity?.isRead && (
                      <span id='opportunityAccordion'>
                        <OpportunityInAccordian
                          opportunityPermissions={permissions.opportunity}
                          opportunities={opportunities}
                          onNewOpportunityAdd={() => {
                            fetchRelatedData();
                          }}
                          accountId={accountData._id}
                          accountName={accountData.accountName}
                          recordsPerLine={3}
                          resource={accountResource}
                          isRedirect={false}
                          isAllowedToUpdate={
                            permissions &&
                            permissions[accountResource] &&
                            permissions[accountResource].isUpdate &&
                            canEdit
                          }
                        />
                      </span>
                    )}
                    {permissions?.projectStrategy?.isRead &&
                      accountResource == customerAccount.accountResource && (
                        <span id="projectsAccordion">
                          <ProjectInAccordion
                            recordsPerLine={3}
                            projectSales={projectSales}
                            type={typeCreateProjectSalesDialog}
                            fetchData={fetchRelatedData}
                            permissions={permissions}
                            isAddProjectSale={true}
                            isAllowedToEdit={
                              permissions &&
                              permissions[accountResource] &&
                              permissions[accountResource].isUpdate &&
                              canEdit
                            }
                          />
                        </span>
                      )}
                    {permissions?.quoteBuilder?.isRead &&
                      accountResource == customerAccount.accountResource && (
                        <span id="quotesAccordion">
                          <QuotesInAccordion
                            recordsPerLine={3}
                            quotes={quotes}
                            fetchData={fetchRelatedData}
                            quoteBuilderPermission={permissions.quoteBuilder}
                            accountId={id}
                            accountName={accountData.accountName}
                            accountResource={accountResource}
                            isRenderedFromCustomerAccount={true}
                            isAllowedToUpdate={
                              permissions &&
                              permissions[accountResource] &&
                              permissions[accountResource].isUpdate &&
                              canEdit
                            }
                          />
                        </span>
                      )}
                    {/* <ProductBuilderInAccordion recordsPerLine={3} /> */}
                    {/* {permissions?.lead?.isRead && accountData.staticData?.lead && (
                  <LeadInAccordion
                    recordsPerLine={3}
                    lead={accountData.staticData?.lead}
                  />
                )} */}
                  </div>
                </>
              )}
            </Box>
          </Paper>
        </div>
        <div id="activitiesSidebar" className="position-relative">
          {/* {showActivity ?
            <Paper >
              {!isMobile && !isTablet && <span className="activityHide cursor-pointer" onClick={handleActivityHideShow}>
                <IoIosArrowDropright className="icon" />
              </span>}
              <Grid container>
                <Grid item xs={12}>
                  {accountData && (
                    <div>
                      <Activity
                        resourceId={accountData._id}
                        resource={accountRoute}
                        restrictedAddActivities={
                          permissions &&
                            permissions[accountResource] &&
                            permissions[accountResource].isUpdate &&
                            canEdit
                            ? []
                            : ["Attachment", "Case"]
                        }
                        relatedTo={[
                          {
                            type: accountResource,
                            referenceId: accountData._id,
                            access: true,
                          },
                        ]}
                        handleActivityRefresh={() => { }}
                        emails={
                          relatedContacts && relatedContacts.length > 0
                            ? cloneDeep(relatedContacts).reduce(
                              (emails, contact) => {
                                if (contact?.email)
                                  emails.push(contact.email);
                                return emails;
                              },
                              []
                            )
                            : []
                        }
                      />
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <QuickLinks quickLinks={quickLinks} />
                </Grid>

                {permissions &&
                  permissions[contactResource] &&
                  permissions[contactResource].isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.related_contacts}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Contacts
                            </Typography>
                            {permissions[contactResource].isCreate && (
                              <span>
                                <IconButton
                                  onClick={handleCreateContact}
                                  color="primary"
                                  size="small"
                                >
                                  <ControlPointIcon />
                                </IconButton>
                              </span>
                            )}
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <RelatedContacts
                                  contacts={_reverse(
                                    relatedContacts.slice(0, 2)
                                  )}
                                  accountId={accountData._id}
                                  accountName={accountData.accountName}
                                  contactApi={contactApi}
                                  contactRoute={contactRoute}
                                />
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}

                {accountData?.staticData?.lead &&
                  permissions &&
                  permissions.lead &&
                  permissions.lead.isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div id="contactsAccordion" className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.leads_data}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Lead
                            </Typography>
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <Card>
                                  <CardContent className="detailListing">
                                    <Grid
                                      container
                                      className="detailCardHeader"
                                    >
                                      <Grid item xs={12} sm={12}>
                                        {accountData?.staticData?.lead?.entity === selectedEntity ? <Link
                                          className="link f_size"
                                          to={`/lead/detail/${accountData?.staticData?.lead?._id}`}
                                        >
                                          {accountData?.staticData?.lead
                                            ?.concatedName || ""}

                                        </Link>
                                          : hasAccessToEntity(accountData?.staticData?.lead?.entity) ?
                                            <Link
                                              className="link f_size"
                                              onClick={() => {
                                                handleEntityChange(accountData?.staticData?.lead?.entity)
                                                history.push(`/lead/detail/${accountData?.staticData?.lead?._id}`)
                                              }
                                              }
                                            >
                                              {accountData?.staticData?.lead
                                                ?.concatedName || ""}

                                            </Link>
                                            :
                                            <span>
                                              {accountData?.staticData?.lead
                                                ?.concatedName || ""}
                                            </span>
                                        }
                                      </Grid>
                                    </Grid>
                                    <Grid container>
                                      <Grid item xs={12} sm={6}>
                                        <DisplayData
                                          label="Title"
                                          value={
                                            accountData?.staticData?.lead
                                              ?.title || "-"
                                          }
                                          icon={<BsPerson size={20} />}
                                        />
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}
              </Grid>
            </Paper>
            :
            !isMobile && !isTablet && <span className="activityShow cursor-pointer" onClick={handleActivityHideShow}>
              <IoIosArrowDropleft className="icon" />
            </span>} */}
          <Paper >
            {!isSmallScreen && <span className={`${showActivity ? "activityHide" : "activityShow"} cursor-pointer`} onClick={handleActivityHideShow}>
              {showActivity ? <IoIosArrowDropright className="icon" /> : <IoIosArrowDropleft className="icon" />}
            </span>}
            <div style={{ display: showActivity ? "block" : "none" }}>
              <Grid container>
                <Grid item xs={12}>
                  {accountData && (
                    <div>
                      <Activity
                        resourceId={accountData._id}
                        resource={accountRoute}
                        restrictedAddActivities={
                          permissions &&
                            permissions[accountResource] &&
                            permissions[accountResource].isUpdate &&
                            canEdit
                            ? []
                            : ["Attachment", "Case"]
                        }
                        relatedTo={[
                          {
                            type: accountResource,
                            referenceId: accountData._id,
                            access: true,
                          },
                        ]}
                        handleActivityRefresh={() => { }}
                        emails={
                          relatedContacts && relatedContacts.length > 0
                            ? cloneDeep(relatedContacts).reduce(
                              (emails, contact) => {
                                if (contact?.email)
                                  emails.push(contact.email);
                                return emails;
                              },
                              []
                            )
                            : []
                        }
                      />
                    </div>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <QuickLinks quickLinks={quickLinks} />
                </Grid>

                {permissions &&
                  permissions[contactResource] &&
                  permissions[contactResource].isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.related_contacts}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Contacts
                            </Typography>
                            {permissions[contactResource].isCreate && (
                              <span>
                                <IconButton
                                  onClick={handleCreateContact}
                                  color="primary"
                                  size="small"
                                >
                                  <ControlPointIcon />
                                </IconButton>
                              </span>
                            )}
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <RelatedContacts
                                  contacts={_reverse(
                                    relatedContacts.slice(0, 2)
                                  )}
                                  accountId={accountData._id}
                                  accountName={accountData.accountName}
                                  contactApi={contactApi}
                                  contactRoute={contactRoute}
                                />
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}

                {accountData?.staticData?.lead &&
                  permissions &&
                  permissions.lead &&
                  permissions.lead.isRead && (
                    <Grid item xs={12}>
                      <BoxWithBorder
                        style={{ marginTop: "3%", padding: "0px" }}
                      >
                        <div id="contactsAccordion" className={`${accountClass.detail_page_div3}`}>
                          <div className={`${accountClass.leads_data}`}>
                            <Typography
                              color="primary"
                              variant="h6"
                              style={{ margin: "0 10px" }}
                            >
                              Related Lead
                            </Typography>
                          </div>
                          {relatedContactsLoading ? (
                            <CommonSkeleton lenArray={[...Array(4).keys()]} />
                          ) : (
                            <>
                              <Box className={`${accountClass.custom_box1}`}>
                                <Card>
                                  <CardContent className="detailListing">
                                    <Grid
                                      container
                                      className="detailCardHeader"
                                    >
                                      <Grid item xs={12} sm={12}>
                                        {accountData?.staticData?.lead?.entity === selectedEntity ? <Link
                                          className="link f_size"
                                          to={`/lead/detail/${accountData?.staticData?.lead?._id}`}
                                        >
                                          {accountData?.staticData?.lead
                                            ?.concatedName || ""}

                                        </Link>
                                          : hasAccessToEntity(accountData?.staticData?.lead?.entity) ?
                                            <Link
                                              className="link f_size"
                                              onClick={() => {
                                                handleEntityChange(accountData?.staticData?.lead?.entity)
                                                history.push(`/lead/detail/${accountData?.staticData?.lead?._id}`)
                                              }
                                              }
                                            >
                                              {accountData?.staticData?.lead
                                                ?.concatedName || ""}

                                            </Link>
                                            :
                                            <span>
                                              {accountData?.staticData?.lead
                                                ?.concatedName || ""}
                                            </span>
                                        }
                                      </Grid>
                                    </Grid>
                                    <Grid container>
                                      <Grid item xs={12} sm={6}>
                                        <DisplayData
                                          label="Title"
                                          value={
                                            accountData?.staticData?.lead
                                              ?.title || "-"
                                          }
                                          icon={<BsPerson size={20} />}
                                        />
                                      </Grid>
                                    </Grid>
                                  </CardContent>
                                </Card>
                              </Box>
                            </>
                          )}
                        </div>
                      </BoxWithBorder>
                    </Grid>
                  )}
              </Grid>
            </div>
          </Paper>
        </div>
      </div>
      <div >
        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Account ${deleteAccount?.accountName ? deleteAccount?.accountName : accountData.accountName || ""
              }`}
            onClose={() => {
              setShowConfirmBox(false)
              setDeleteAccountId({})
            }}
            onOk={handleDeleteAcc}
          />
        ) : null}
        {showApproveDisapproveConfirmBox ? (
          <ConfirmationDialog
            open={showApproveDisapproveConfirmBox}
            message={`Are you sure you want to ${accountData.staticData?.approved ? "disapprove" : "approve"
              } this Account ?`}
            onClose={() => setShowApproveDisapproveConfirmBox(false)}
            onOk={handleApproveDisapprove}
          />
        ) : null}
        {openUpdateDialog && showAtLast ? (
          <ManageAccount
            isNew={false}
            open={openUpdateDialog}
            onClose={closeUpdateDIalog}
            accountData={{
              fields: accountFields.map((f) => {
                return f.fieldData;
              }),
              initialValues: getObjKeysWithValues(
                accountData,
                accountFields.map((f) => {
                  return f.fieldData;
                })
              ),
            }}
            loading={loading}
            handleSubmit={onUpdateAccount}
            accountId={accountData?._id}
            formValues={formValues}
            handleValuesChange={handleValuesChange}
          />
        ) : openUpdateDialog ? (
          <ManageAccount
            isNew={false}
            open={openUpdateDialog}
            onClose={closeUpdateDIalog}
            accountData={{
              fields: filteredAccountFields.map((f) => {
                return f.fieldData;
              }),
              initialValues: getObjKeysWithValues(
                Object.keys(editAccountData).length ? editAccountData : accountData,
                filteredAccountFields.map((f) => {
                  return f.fieldData;
                })
              ),
            }}
            loading={loading}
            handleSubmit={onUpdateAccount}
            accountId={editAccountData._id ? editAccountData._id : accountData?._id}
            formValues={formValues}
            handleValuesChange={handleValuesChange}
          />
        ) : null}

        {showCreateOpportunityDialog && (
          <ManageOpportunityDialog
            open={showCreateOpportunityDialog}
            onClose={() => setShowCreateOpportunityDialog(false)}
            onSuccess={() => {
              setShowCreateOpportunityDialog(false);
              fetchRelatedData();
            }}
            accountId={accountData._id}
            resource={accountResource}
            isRedirectTodetailPage={false}
          />
        )}
        {showCreateContactDialog && (
          <ManageContactDialog
            open={showCreateContactDialog}
            onClose={() => {
              setShowCreateContactDialog(false);
              fetchRelatedData();
            }}
            contactResource={contactResource}
            accountId={accountData._id}
            contactApi={contactApi}
            account={props?.account}
          />
        )}
        {showAccountHierarchyInFullScreenDialog && (
          <FullScreenDialog
            heading="Account Hierarchy"
            open={showAccountHierarchyInFullScreenDialog}
            close={() => {
              setShowAccountHierarchyInFullScreenDialog(false);
            }}
          >
            <AccountHierarchy
              data={accountHierarchyData}
              currentAccountId={accountData._id}
              accountRoute={accountRoute}
            />
          </FullScreenDialog>
        )}
        {showCreateAccountDialog ? (
          <ManageAccountDialog
            open={showCreateAccountDialog}
            onClose={() => {
              setShowCreateAccountDialog(false)
              setParentId(undefined)
              fetchAccountData()
            }}
            parentId={parentId}
            id={null}
            accountResource={accountResource}
            accountApi={accountApi}
            isClone={false}
            accountNameForClone={''}
            isRedirectToDetailPage={false}
          />
        ) : null}
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
            title="Additional Dialog"
            handleSave={handleSave}
            fieldData={sectionFields}

          />
        )}
      </div>
    </>
  );
}

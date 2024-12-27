import { Box, Button, CircularProgress, Dialog, Menu, MenuItem, TextField, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { Skeleton } from '@mui/material';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import ReactDOM from 'react-dom';
import { BiLayerPlus } from 'react-icons/bi';
import { GiReceiveMoney } from 'react-icons/gi';
import { HiPencil } from 'react-icons/hi';
import { IoArrowDownCircleSharp } from 'react-icons/io5';
import { MdDelete } from 'react-icons/md';
import { VscIssueReopened, VscVersions } from 'react-icons/vsc';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { useTableReducer } from 'src/components/CustomReactTable';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import routes from '../../../components/Helpers/Routes';
import ProjectInAccordion from '../../../components/ProjectInAccordion/ProjectInAccordion';
import {
  ACTIVITY_RESOURCE,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  CustomDialogTransition,
  customerAccount,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  opportunity,
  quoteBuilder,
  sidebarResource,
  termsAndCondition,
  displayCardDate,
} from '../../../constants/helpers';
import contactClass from '../../Contact/contact.module.scss';
import DOAReasonDialog from '../../DOA/DOAReasonDialog';
import AllVersionStatus from '../AllVersionStatus';
import ManageQuoteDialog from '../ManageQuote/ManageQuoteDialog';
import QuoteDetailPage from './QuoteDetailPage';
import QuoteProcess from './QuoteProcess';
import Step from 'src/pages/DynamicForm/Step';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const DOASteps = [
  {
    key: 'New',
    label: 'Product Builder'
  },
  {
    key: 'Price Builder',
    label: 'Price Builder'
  },
  {
    key: 'Quote Builder',
    label: 'Quote Builder'
  },
  {
    key: 'DOA Process',
    label: 'DOA Process'
  },
  {
    key: 'Send To Customer',
    label: 'Send To Customer'
  },
  {
    key: 'End',
    label: 'End'
  }
];

const OtherSteps = [
  {
    key: 'New',
    label: 'Product Builder'
  },
  {
    key: 'Price Builder',
    label: 'Price Builder'
  },
  {
    key: 'Quote Builder',
    label: 'Quote Builder'
  },
  {
    key: 'Send To Customer',
    label: 'Send To Customer'
  },
  {
    key: 'End',
    label: 'End'
  }
];

export default function QuoteDetail() {
  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();
  const { state, dispatch } = useTableReducer({ renderedFrom: '' });
  const [quoteData, setQuoteData] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { qbResource, qbApi } = quoteBuilder;
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [cloneQuoteWithVersionNumber, setCloneQuoteWithVersionNumber] = useState(0);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [isQuoteClone, setIsQuoteClone] = useState(false);

  const [productBuilderId, setProductBuilderId] = useState('');
  const [versionStatus, setVersionStatus] = useState('Building Quote');
  const [processStatus, setProcessStatus] = useState('New');
  const [reopenReasonDialog, setReopenReasonDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [quoteReOpening, setQuoteReOpening] = useState(false);
  const [editCurrency, setEditCurrency] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [relatedTo, setRelatedTo] = useState({});
  const [typeCreateProjectSalesDialog, setTypeCreateProjectSalesDialog] = useState([{ id: id, type: qbResource }]);
  const [DOAneeded, setDOAneeded] = useState(false);
  const [DOAApproved, setDOAApproved] = useState(false);
  const [isCloning, setCloning] = useState(false);

  const [DOARequestId, setDOARequestId] = useState(null);
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [showAllVersionStatus, setShowAllVersionStatus] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showTotalSalesDialog, setShowTotalSalesDialog] = useState(false);
  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);
  const [DOAlimit, setDOALimit] = useState(0);
  const [DOAsetup, setDOAsetup] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (id) {
      if (location.state !== undefined) {
        setTabValue(location.state?.tabValue);
        fetchQuoteData(parseInt(location.state?.versionNumber));
      } else {
        fetchQuoteData(0);
      }

      fetchTermsAndConditions();
      fetchRelatedTo();
      fetchPolicy();
    }
  }, [id]);

  const fetchDoaLimit = () => {
    axiosInstance()
      .post('doa-request/limit', { entity: selectedEntity })
      .then(({ data: { data } }) => {
        setDOAsetup(data.doasetup);
        setDOALimit(data.limit && data.limit !== 0 ? data.limit : data.minLimit);
        // setLastUser(data.lastUser);
      })
      .catch((err) => {
        // toastConfig.setToastConfig(err);
      });
  };

  const fetchRelatedTo = () => {
    axiosInstance()
      .get(`/quote-builder/related/${id}`)
      .then(({ data: { data } }) => {
        setRelatedTo(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const getMainPoints = useMemo(() => {
    let mainPoint = {};
    if (quoteData) {
      mainPoint['Account Name'] = quoteData?.accountName?.optionLabel || '';
      mainPoint['Expiry Date'] = displayCardDate(quoteData?.closeDate);
      mainPoint['Estimated Amount'] = quoteData?.estimatedAmount
        ? formatAmountWithCurrency(quoteData?.currency, quoteData?.estimatedAmount).fullFormatAmount
        : '';
      mainPoint['Quote Owner'] = quoteData?.owner?.optionLabel || '';
    }
    return mainPoint;
  }, [quoteData?.accountName, quoteData?.closeDate, quoteData?.estimatedAmount, quoteData?.currency, quoteData?.owner]);

  const ifQuoteApproved = useMemo(() => {
    let approved = false;
    let disapproved = false;
    let versionApproved = currentVersion;
    let versionDisapproved = currentVersion;
    let manualApproval = false;
    let manualDispproval = false;

    if (quoteData) {
      Object.keys(quoteData.versions).forEach((v) => {
        if (quoteData.versions[v]?.status.includes('Accepted by Customer') || quoteData.versions[v]?.status === 'Booked by Customer') {
          approved = true;
          versionApproved = Number(v);
          manualApproval = quoteData.versions[v]?.customerResponse?.manual;
        }
        if (
          quoteData.versions[v]?.status.includes('Rejected by Customer') ||
          quoteData.versions[v]?.status.includes('Not Booked by Customer') ||
          quoteData.versions[v]?.status.includes('Others')
        ) {
          disapproved = true;
          versionDisapproved = Number(v);
          manualDispproval = quoteData.versions[v]?.customerResponse?.manual;
        }
      });
    }
    return {
      approved,
      versionApproved,
      disapproved,
      versionDisapproved,
      manualApproval,
      manualDispproval
    };
  }, [quoteData?.versions]);

  const handleChangeVersionFromAllVersion = (versionNumber) => {
    setCurrentVersion(versionNumber);
    setShowAllVersionStatus(false);
  };

  const handleCloneQuoteWithVersionFromAllVersion = (versionNumber) => {
    setCloneQuoteWithVersionNumber(versionNumber);
    setOpenUpdateDialog(true);
    setIsQuoteClone(true);
    setShowAllVersionStatus(false);
  };

  const handleChangeVersion = (event) => {
    setCurrentVersion(parseInt(event.target.value));
    setProductBuilderId(quoteData['versions'][event.target.value]['productBuilderId']);
    setVersionStatus(quoteData['versions'][event.target.value]['status']);
    setProcessStatus(quoteData['versions'][event.target.value]['processStatus']);
  };

  const handleOpenUpdateDialog = () => {
    axiosInstance()
      .get(`/quote-builder/can-update-currency/${id}`)
      .then(({ data: { data } }) => {
        setEditCurrency(data);
        setOpenUpdateDialog(true);
      });
  };

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.quoteBuilder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchQuoteData = (version: any) => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${qbApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          ReactDOM.unstable_batchedUpdates(() => {
            setQuoteData(data);

            const dataOfTyoes = [...typeCreateProjectSalesDialog];
            if (data.customerAccountName.optionValue) {
              dataOfTyoes.push({
                id: data.customerAccountName.optionValue,
                type: customerAccount.accountResource
              });
            } else if (data.opportunity.optionValue) {
              dataOfTyoes.push({
                id: data?.opportunity?.optionValue,
                type: opportunity.opportunityResource
              });
            }
            setTypeCreateProjectSalesDialog(dataOfTyoes);

            setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.quoteBuilder, data));
            setAllowedToDelete(checkIsAllowedToDelete(user, sidebarResource.quoteBuilder, data?.owner?.optionValue));

            let keys = Object.keys(data.versions);
            let tempCurrentVersion;
            if (version == 0) {
              tempCurrentVersion = parseInt(keys[keys.length - 1]);
              setCurrentVersion(parseInt(keys[keys.length - 1]));
              setProcessStatus(data.versions[keys[keys.length - 1]].processStatus);
              setProductBuilderId(data.versions[keys[keys.length - 1]].productBuilderId);
              setVersionStatus(data.versions[keys[keys.length - 1]].status);
              dispatch({ type: 'selection', selectedRecords: data.versions[keys[keys.length - 1]].TNC });
            } else {
              tempCurrentVersion = version;
              setCurrentVersion(version);
              setProcessStatus(data.versions[version].processStatus);
              setProductBuilderId(data.versions[version].productBuilderId);
              setVersionStatus(data.versions[version].status);
              dispatch({ type: 'selection', selectedRecords: data.versions[version].TNC });
            }
            setCustomizedRoutes([
              { title: resources?.quoteBuilder?.titlePlural, path: routes.quoteBuilder.path },
              { title: `${data?.quoteName} (V-${tempCurrentVersion})`, hasOnClick: true }
            ]);
            fetchDoaLimit();
            setLoading(false);
          });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const handleDeleteQuote = () => {
    if (quoteData?._id) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
          ids: [quoteData._id]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          history.push({
            pathname: routes.quoteBuilder.path
          });
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

  const fetchTermsAndConditions = (selectedTermsAndConditions = null, updateVersionStatus = false) => {
    dispatch({ type: 'loading', loading: true });
    const { selectedRecords } = state;
    axiosInstance()
      .get(`${termsAndCondition.api}?limit=0`)
      .then(({ data: { data, count } }) => {
        const selectedRows =
          selectedRecords && selectedRecords.length ? data.filter((d) => state.selectedRecords.filter((_d) => _d._id === d._id).length > 0) : [];

        let rows = data.map((tnc) => {
          return {
            ...tnc,
            id: tnc._id,
            name: tnc.name
          };
        });

        dispatch({ type: 'selection', selectedRecords: selectedRows });
        dispatch({
          type: 'initialize',
          data: rows,
          count: count
        });

        if (updateVersionStatus) {
          handleVersionUpdate(versionStatus, selectedRows);
        }
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleReOpenQuote = () => {
    const previousVersionTNC = quoteData.versions[ifQuoteApproved.versionApproved]?.TNC;
    setQuoteReOpening(true);
    setReopenReasonDialog(false);
    setReopenReason('');
    let notEndVersions = [];
    Object.keys(quoteData.versions).forEach((v) => {
      if (quoteData.versions[v]?.processStatus !== 'End') {
        notEndVersions.push(v);
      }
    });

    if (notEndVersions.length !== 0) {
      axiosInstance()
        .put(`/quote-builder/updateVersions/${quoteData._id}`, { versions: notEndVersions, status: 'Not Booked', processStatus: 'End' })
        .then(() => {
          axiosInstance()
            .post(`/quote-builder/createVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, {
              TNC: previousVersionTNC,
              comment: [`Auto-Cloned from Re-opened Version ${ifQuoteApproved.versionApproved}`]
            })
            .then(() => {
              let comment = quoteData.versions[currentVersion]?.comment;
              if (typeof comment === 'string') {
                comment = [comment, reopenReason];
              } else {
                comment.push(reopenReason);
              }
              axiosInstance()
                .post(`quote-builder/updateVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, {
                  TNC: previousVersionTNC,
                  status: 'Re-Open',
                  comment: comment
                })
                .then(() => {
                  fetchQuoteData(0);
                  setQuoteReOpening(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setQuoteReOpening(false);
                });
            })
            .catch((error) => {
              toastConfig.setToastConfig(error);
              setQuoteReOpening(false);
            });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setQuoteReOpening(false);
        });
    } else {
      axiosInstance()
        .post(`/quote-builder/createVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, {
          TNC: previousVersionTNC,
          comment: [`Auto-Cloned from Re-opened Version ${ifQuoteApproved.versionApproved}`]
        })
        .then(() => {
          axiosInstance()
            .post(`quote-builder/updateVersion/${quoteData._id}?version=${ifQuoteApproved.versionApproved}`, {
              TNC: previousVersionTNC,
              status: 'Re-Open'
            })
            .then(() => {
              fetchQuoteData(0);
              setQuoteReOpening(false);
            })
            .catch((err) => {
              toastConfig.setToastConfig(err);
              setQuoteReOpening(false);
            });
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setQuoteReOpening(false);
        });
    }
  };

  const handleVersionUpdate = (versionStatus, selectedTermsAndConditions) => {
    let body = {
      status: versionStatus,
      TNC: selectedTermsAndConditions
    };
    axiosInstance()
      .post(`quote-builder/updateVersion/${quoteData._id}?version=${currentVersion}`, body)
      .then(() => { })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleReopenReasonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReopenReason(event.target.value);
  };

  const deleteVersion = () => {
    let versions = quoteData?.versions;
    delete versions[currentVersion];
    axiosInstance()
      .delete(`${qbApi}/${quoteData._id}/${currentVersion}`)
      .then(() => {
        fetchQuoteData(0);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const QuoteStatusChange = (accepted, signature, comment) => {
    if (DOARequestId) {
      if (accepted !== 'Rejected') {
        axiosInstance()
          .post('/doa-request/doaResponse/' + DOARequestId, { response: 'Accepted' })
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            fetchQuoteData(currentVersion);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setShowQuoteStatusChangeDialog(false);
          });
      } else {
        axiosInstance()
          .post('/doa-request/doaResponse/' + DOARequestId, { response: 'Rejected', comment: comment })
          .then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data.message
            });
            fetchQuoteData(currentVersion);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            setShowQuoteStatusChangeDialog(false);
          });
      }
    }
  };

  const cloneVersion = () => {
    const previousVersionTNC = quoteData.versions[currentVersion]?.acceptedColumns;
    setCloning(true);
    axiosInstance()
      .post(`/quote-builder/createVersion/${quoteData._id}?version=${currentVersion}`, { TNC: previousVersionTNC })
      .then(() => {
        fetchQuoteData(0);
        setCloning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setCloning(false);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={customizedRoutes}
            onRouteClick={() => {
              setShowAllVersionStatus(true);
            }}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {quoteData ? (
              <>
                {processStatus !== 'New' && (
                  <ThemeButton
                    onClick={() => {
                      setShowTotalSalesDialog(true);
                    }}
                    startIcon={<GiReceiveMoney />}
                    mobileTooltip='Quote Summary'
                    iconForMobile={<GiReceiveMoney />}
                  >
                    Quote Summary
                  </ThemeButton>
                )}
                <ThemeButton
                  iconForMobile={<VscVersions size={20} />}
                  onClick={() => {
                    setShowAllVersionStatus(true);
                  }}
                  startIcon={<VscVersions />}
                  mobileTooltip={`Version : ${currentVersion}`}
                >
                  {`Version : ${currentVersion}`}
                </ThemeButton>
                <ThemeButton
                  iconForMobile={<ExpandMore />}
                  onClick={openActions}
                  endIcon={<ExpandMore />}
                  mobileTooltip={`Actions`}
                >
                  Actions
                </ThemeButton>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorEl)}
                  onClose={closeActions}
                >
                  {allowedToEdit && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        handleOpenUpdateDialog();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <HiPencil />
                        <Typography variant="inherit">Edit Quote</Typography>
                      </div>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      closeActions();
                      cloneVersion();
                    }}
                    disabled={!allowedToEdit || isCloning || loading || ifQuoteApproved.approved}
                  >
                    <div className="flex items-center gap-3">
                      {isCloning ? <CircularProgress color="inherit" size={16} /> : <BiLayerPlus />}
                      <Typography variant="inherit">
                        {isCloning ? <>Cloning Version-{currentVersion}</> : `Clone Version-${currentVersion}`}
                      </Typography>
                    </div>
                  </MenuItem>
                  {allowedToEdit && ifQuoteApproved.approved && (
                    <MenuItem
                      disabled={quoteReOpening}
                      onClick={() => {
                        closeActions();
                        setReopenReasonDialog(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <VscIssueReopened />
                        <Typography variant="inherit">Re-Open</Typography>
                      </div>
                    </MenuItem>
                  )}
                  {currentVersion !== 1 && ifQuoteApproved.approved === false && (
                    <MenuItem
                      disabled={
                        allowedToEdit &&
                          !['Sent for DOA', 'Sent to Customer']?.includes(quoteData?.versions[currentVersion]?.status) &&
                          !quoteData?.versions[currentVersion]?.status?.includes('Accepted')
                          ? false
                          : true
                      }
                      onClick={() => {
                        closeActions();
                        deleteVersion();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <MdDelete />
                        <Typography variant="inherit">Delete Version-{currentVersion}</Typography>
                      </div>
                    </MenuItem>
                  )}
                  {permissions[qbResource].isDelete && allowedToDelete && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        setShowConfirmBox(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <MdDelete />
                        <Typography variant="inherit">Delete Quote</Typography>
                      </div>
                    </MenuItem>
                  )}
                </Menu>
                {DOAApproved && versionStatus === 'Sent for DOA' && (
                  <>
                    <HtmlTooltip title={`Accept`}>
                      <Button
                        onClick={() => {
                          QuoteStatusChange('Accepted', '', '');
                        }}
                        variant="outlined"
                        size="small"
                        className="btn-outline-v1 mx-1"
                        startIcon={<ThumbUpIcon />}
                        color="primary"
                      >
                        {isMobile && !isTablet ? '' : `Accept`}
                      </Button>
                    </HtmlTooltip>
                    <HtmlTooltip title="Reject">
                      <Button
                        onClick={() => {
                          setQuoteStatusChangeData('Rejected');
                          setShowQuoteStatusChangeDialog(true);
                        }}
                        className="mx-1"
                        startIcon={<ThumbDownIcon />}
                        variant="contained"
                        size="small"
                        color="primary"
                      >
                        {isMobile && !isTablet ? '' : 'Reject'}
                      </Button>
                    </HtmlTooltip>
                  </>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={quoteData?._id} resource={ACTIVITY_RESOURCE.quote} resourceLabel={quoteData?.quoteName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Details</CustomTab>
          <CustomTab value={1}>Quote Versions</CustomTab>
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <>
            {quoteData && (
              <QuoteDetailPage quoteData={quoteData} selectedEntity={selectedEntity} ifQuoteApprovedAapproved={ifQuoteApproved.approved} />
            )}
            {permissions?.projectSales?.isRead && (
              <div className="pt-3 ">
                <ProjectInAccordion
                  recordsPerLine={3}
                  projectSales={(relatedTo && relatedTo['Project Sales']?.Quotes) || []}
                  type={typeCreateProjectSalesDialog}
                  fetchData={() => fetchRelatedTo()}
                  permissions={permissions}
                  isAddProjectSale={true}
                  isAllowedToEdit={allowedToEdit}
                  resources={resources}
                />
              </div>
            )}
          </>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {quoteData && (
            <QuoteProcess
              handleVersionUpdate={handleVersionUpdate}
              state={state}
              dispatch={dispatch}
              quoteData={quoteData}
              processStatus={processStatus}
              setProcessStatus={setProcessStatus}
              ifQuoteApproved={ifQuoteApproved}
              allowedToEdit={allowedToEdit}
              currentVersion={currentVersion}
              productBuilderId={productBuilderId}
              versionStatus={versionStatus}
              fetchQuoteData={fetchQuoteData}
              globalLoading={loading}
              DOASteps={DOASteps}
              OtherSteps={OtherSteps}
              DOAneeded={DOAneeded}
              setDOAneeded={setDOAneeded}
              setDOAApprovedFromQuoteDetails={setDOAApproved}
              setDOARequestIdFromQuoteDetails={setDOARequestId}
              showTotalSalesDialog={showTotalSalesDialog}
              setShowTotalSalesDialog={setShowTotalSalesDialog}
              setIsAddNewProduct={setIsAddNewProduct}
              isAddNewProduct={isAddNewProduct}
              setIsAddExistingProduct={setIsAddExistingProduct}
              isAddExistingProduct={isAddExistingProduct}
              DOAsetup={DOAsetup}
              DOAlimit={DOAlimit}
            />
          )}
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 2}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.quoteBuilder}
                  data={quoteData}
                  allowedToEdit={permissions?.quoteBuilder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this Quote?`}
          onClose={() => setShowConfirmBox(false)}
          onOk={handleDeleteQuote}
        />
      )}
      {openUpdateDialog && (
        <ManageQuoteDialog
          open={openUpdateDialog}
          onSuccess={() => {
            setIsQuoteClone(false);
            setOpenUpdateDialog(false);
            fetchQuoteData(currentVersion);
            fetchRelatedTo();
          }}
          onClose={() => {
            setOpenUpdateDialog(false);
            setIsQuoteClone(false);
          }}
          isNew={false}
          isClone={isQuoteClone}
          dataToUpdate={quoteData}
          resource={null}
          isRedirectTodetailPage={false}
          contactId={null}
          opportunityId={null}
          disableOwnerDropDown={true}
          editCurrency={editCurrency}
          quoteApproved={isQuoteClone ? false : ifQuoteApproved.approved}
          cloneQuoteWithVersionNumber={cloneQuoteWithVersionNumber}
          doaCollaboratorResources={user.user?.doa?.map((obj) => obj.user)}
        />
      )}
      {reopenReasonDialog && (
        <Dialog
          maxWidth="sm"
          fullWidth
          TransitionComponent={CustomDialogTransition}
          aria-labelledby="customized-dialog-title"
          onClose={() => {
            setReopenReasonDialog(false);
          }}
          open={reopenReasonDialog}
        >
          <CustomDialogHeader
            title="Reason for Re-Open"
            onClose={() => {
              setReopenReasonDialog(false);
            }}
            showManimizeMaximize={false}
          />
          <CustomDialogContent>
            <TextField
              fullWidth
              id="outlined-multiline-static"
              label="Reason"
              multiline
              value={reopenReason}
              onChange={handleReopenReasonChange}
              rows={3}
              required
              variant="outlined"
            />
          </CustomDialogContent>
          <CustomDialogFooter>
            <Button size="small" onClick={() => setReopenReasonDialog(false)} color="primary">
              Close
            </Button>
            <Button size="small" variant="contained" disabled={reopenReason === ''} onClick={handleReOpenQuote} color="primary">
              Save
            </Button>
          </CustomDialogFooter>
        </Dialog>
      )}
      {showQuoteStatusChangeDialog && (
        <DOAReasonDialog
          reasonDialogOpen={showQuoteStatusChangeDialog}
          handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
          QuoteStatusChange={QuoteStatusChange}
          accepted={quoteStatusChangeData}
        />
      )}
      {quoteData && showAllVersionStatus && (
        <AllVersionStatus
          open={showAllVersionStatus}
          onClose={() => setShowAllVersionStatus(false)}
          quoteId={id}
          quoteData={quoteData}
          quotePermissions={permissions[qbResource]}
          fetchQuoteData={fetchQuoteData}
          handleChangeVersionFromAllVersion={handleChangeVersionFromAllVersion}
          handleCloneQuoteWithVersionFromAllVersion={handleCloneQuoteWithVersionFromAllVersion}
        />
      )}
    </Box>
  );
}

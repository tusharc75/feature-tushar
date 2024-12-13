import { Box, Button, Grid, Menu, MenuItem } from '@material-ui/core';
import { Edit, ExpandMore } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { camelCase } from 'lodash';
import queryString from 'query-string';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { IoMdDownload } from 'react-icons/io';
import { VscVersions } from 'react-icons/vsc';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import Steps, { getIndex } from 'src/components/Steps';
import Versions from 'src/components/Versions';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import {
  ACTIVITY_RESOURCE,
  CHILD_RESOURCE,
  INVOICE_STATUS,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  invoice,
  invoiceProcessSteps,
  sidebarResource
} from '../../constants/helpers';
import CreditMemo from './CreditMemo';
import Invoice from './Invoice';
import ManageInvoiceDialog from './ManageInvoiceDialog';
import Material from './Material';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Step from '../DynamicForm/Step';
import { RiExchangeBoxFill } from 'react-icons/ri';

const InvoiceDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource.invoice);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [resourceData, setResourceData] = useState(null);
  const { isOffline } = useContext(CustomOfflineContext);

  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [invoiceFields, setInvoiceFields] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [versionDialog, setVersionDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);
  const [showReOpenConfirmBox, setShowReOpenConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const invoiceProcessStepsNames = React.useMemo(() => {
    return invoiceProcessSteps.map((item) => item.name);
  }, [invoiceProcessSteps]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchInvoiceData();
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.invoice}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchFields = async () => {
    try {
      const response: any = await axiosInstance().get('/field?resource=Invoice');
      response?.data?.data.some((o) => {
        if (o?.fieldData?.fieldName === 'status') {
          setStatusOptions([...o.fieldData.option]);
          return true;
        }
      });
      setInvoiceFields(response?.data?.data);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      let data;
      const response: any = await axiosInstance().get(`${invoice.api}/${id}`);
      data = response?.data?.data;
      if ([INVOICE_STATUS.closed, INVOICE_STATUS.cancelled]?.includes(data?.status)) {
        setCurrentStep(invoiceProcessSteps?.length - 1);
      } else {
        setCurrentStep(getIndex(data?.processStatus, invoiceProcessSteps));
      }
      setHeadingLabel(data.invoiceNumber);
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.invoice, data));
      setAllowedToDelete(
        permissions?.invoice?.isDelete && checkIsAllowedToDelete(user, sidebarResource.invoice, data.owner.optionValue) && data?.canDelete
      );
      setInvoiceData(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${invoice.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.push(`${invoice.api}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const handleDownload = () => {
    setIsDownloading(true);

    axiosInstance()
      .get(`/invoice/zip/${invoiceData._id}`, {
        responseType: 'blob'
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        const filename = response.headers['content-disposition'].split('filename=')[1];
        link.setAttribute('download', filename);

        document.body.appendChild(link);
        link.click();
        setIsDownloading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  };

  const handleChangeStatus = (status) => {
    setUpdateLoading(true);
    const invoices = [
      {
        _id: invoiceData._id,
        prevStatus: invoiceData?.status
      }
    ];
    axiosInstance()
      .put(`${invoice.api}/update-status`, { status: status, invoices: invoices })
      .then(({ data: { data } }) => {
        fetchInvoiceData();
        setShowClosedConfirmBox(false);
        setShowReOpenConfirmBox(false);
        setUpdateLoading(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        setUpdateLoading(false);
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const validateStatus = (status) => {
    const currIdx = statusOptions.findIndex((status) => status.optionValue === invoiceData.status);
    return statusOptions[currIdx + 1]?.optionValue !== status;
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[{ ...routes.invoice, title: resources?.invoice?.titlePlural }, { title: invoiceData?.invoiceNumber }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {invoiceData ? (
              <>
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'outlined'}
                  className="btn-outline-v1"
                  type="button"
                  size="small"
                  disabled={isDownloading ? true : false}
                  startIcon={isMobile ? '' : <IoMdDownload />}
                  onClick={(e) => {
                    handleDownload();
                  }}
                >
                  {isMobile && !isTablet ? <IoMdDownload size={20} /> : isDownloading ? 'Please wait...' : 'Download'}
                </Button>
                {invoiceData?.versions?.length && (
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="primary"
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={() => {
                      setVersionDialog(true);
                    }}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    startIcon={isMobile && !isTablet ? null : <VscVersions />}
                  >
                    {isMobile && !isTablet ? <VscVersions size={20} /> : 'Versions'}
                  </Button>
                )}
                {permissions?.invoice?.isUpdate && allowedToEdit && statusOptions?.length > 0 && (
                  <Button
                    variant={'outlined'}
                    color="default"
                    size="small"
                    onClick={openActions}
                    className="btn-outline-v1"
                    disabled={updateLoading}
                    aria-controls="action-menu"
                    endIcon={<ExpandMore />}
                  >
                    {isMobile && !isTablet ? <RiExchangeBoxFill size={24} style={{ color: 'var(--primary-text)' }} /> : 'Change Status'}
                  </Button>
                )}
                {permissions?.invoice?.isUpdate &&
                  allowedToEdit &&
                  ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status) && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      className={'btn-outline-v1'}
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      {isMobile && !isTablet ? <Edit /> : 'Edit'}
                    </Button>
                  )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
                  onClose={closeActions}
                >
                  {statusOptions
                    ?.filter((f) => f.optionValue !== INVOICE_STATUS.cancelled)
                    .map((o) => {
                      return (
                        <MenuItem
                          key={o?.optionValue}
                          disabled={validateStatus(o?.optionValue)}
                          onClick={() => {
                            closeActions();
                            handleChangeStatus(o?.optionValue);
                          }}
                          value={o}
                        >
                          {o?.optionLabel}
                        </MenuItem>
                      );
                    })}
                </Menu>
                {/* {permissions?.invoice?.isUpdate &&
                  allowedToEdit &&
                  [INVOICE_STATUS.readyToInvoice, INVOICE_STATUS.invoiced].includes(invoiceData?.status) && (
                    <ButtonWithPulse
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={() => {
                        setShowClosedConfirmBox(true);
                      }}
                      className={'btn-outline-v1'}
                    >
                      Close
                    </ButtonWithPulse>
                  )} */}
                {permissions?.invoice?.isUpdate && allowedToEdit && invoiceData?.status === INVOICE_STATUS.closed && (
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={() => {
                      setShowReOpenConfirmBox(true);
                    }}
                  >
                    Re-Open
                  </Button>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton referenceId={invoiceData?._id} resource={ACTIVITY_RESOURCE.invoice} resourceLabel={invoiceData?.invoiceNumber} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {permissions?.creditMemo?.isRead && <CustomTab value={2}>{resources?.creditMemo?.titlePlural}</CustomTab>}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>

        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !invoiceFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <>
                <DetailsPage data={invoiceData} fields={invoiceFields} />
              </>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            {invoiceData ? (
              <Grid item xs={12} sm={12} md={12} lg={12}>
                <Steps
                  isNextStep={false}
                  nextStep={nextStep}
                  steps={invoiceProcessSteps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  isStepEnded={[INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status)}
                  setStepFullScreen={() => setStepFullScreen(true)}
                  updateStatus={(step: number) => {
                    dynamicFormUpdateProcessStatus(sidebarResource.invoice, invoiceProcessStepsNames[step], id);
                  }}
                />
                <ContentFullScreen title={invoiceProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
                  {currentStep === 0 && invoiceData && (
                    <Material
                      invoiceData={invoiceData}
                      fetchInvoiceData={fetchInvoiceData}
                      setNextStep={setNextStep}
                      stepFullScreen={stepFullScreen}
                      allowedToEdit={allowedToEdit && permissions?.invoice?.isUpdate ? true : false}
                    />
                  )}
                  {currentStep === 1 && invoiceData && (
                    <Invoice
                      invoiceData={invoiceData}
                      setNextStep={setNextStep}
                      handleChangeStatus={handleChangeStatus}
                      stepFullScreen={stepFullScreen}
                      statusOptions={statusOptions}
                    />
                  )}
                </ContentFullScreen>
              </Grid>
            ) : (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <CreditMemo
            invoiceData={invoiceData}
            allowedToEdit={allowedToEdit && ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status)}
          />
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 3}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.invoice}
                  data={invoiceData}
                  allowedToEdit={permissions?.invoice?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this invoice: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showClosedConfirmBox && (
        <ConfirmationDialog
          open={showClosedConfirmBox}
          message={`Are you sure you want to close ${invoiceData?.invoiceNumber} ?`}
          onClose={() => {
            setShowClosedConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(INVOICE_STATUS.closed);
          }}
        />
      )}

      {showReOpenConfirmBox && (
        <ConfirmationDialog
          open={showReOpenConfirmBox}
          message={`Are you sure you want to re-open ${invoiceData?.invoiceNumber} ?`}
          onClose={() => {
            setShowReOpenConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(INVOICE_STATUS.invoiced);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageInvoiceDialog
          isClone={false}
          open={openUpdateDialog}
          invoiceId={id}
          invoiceData={invoiceData}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchInvoiceData();
          }}
        />
      )}
      {versionDialog && (
        <Versions
          id={id}
          label={invoiceData?.invoiceNumber}
          childResource={CHILD_RESOURCE.invoiceProduct}
          resource={sidebarResource.invoice}
          referenceData={invoiceData}
          versions={invoiceData?.versions}
          renderedFrom={`${renderedFrom}_versions`}
          handleClose={() => {
            setVersionDialog(false);
          }}
        />
      )}
    </Box>
  );
};

export default InvoiceDetails;

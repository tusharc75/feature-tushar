import React, { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Tabs, Tab, Menu, MenuItem } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { invoice, invoiceProcessSteps, ACTIVITY_RESOURCE, INVOICE_STATUS, CHILD_RESOURCE, sidebarResource } from '../../constants/helpers';
import ManageInvoiceDialog from './ManageInvoiceDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import TabPanel from '../../components/TabPanel';
import queryString from 'query-string';
import { FaWpforms } from 'react-icons/fa';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import Steps, { getIndex } from 'src/components/Steps';
import Material from './Material';
import AdditionalCost from './AdditionalCost';
import Invoice from './Invoice';
import { isMobile, isTablet } from 'react-device-detect';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { GrStatusInfo, VscVersions } from 'react-icons/all';
import { camelCase } from 'lodash';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ActivityButton from 'src/components/Activity/ActivityButton';
import Versions from 'src/components/Versions';
import ButtonWithPulse from 'src/components/ButtonWithPulse';
import { IoMdDownload } from 'react-icons/io';
import CreditMemo from './CreditMemo';

const InvoiceDetails = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.invoice.title);
  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;

  const {
    state: { user, permissions }
  }: any = useData();

  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [invoiceFields, setInvoiceFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [nextStep, setNextStep] = useState(true);
  const [currentStep, setCurrentStep] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [versionDialog, setVersionDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);


  const [showClosedConfirmBox, setShowClosedConfirmBox] = useState(false);

  const invoiceProcessStepsNames = React.useMemo(() => {
    return invoiceProcessSteps.map((item) => item.name);
  }, [invoiceProcessSteps]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchInvoiceData();
    }
  }, [id]);

  useEffect(() => {
    if (currentStep !== null && currentStep >= 0 && currentStep <= 2) {
      updateProcessStatus(invoiceProcessStepsNames[currentStep]);
    }
  }, [currentStep]);

  const updateProcessStatus = (processStatus) => {
    axiosInstance()
      .put(`${invoice.api}/${id}/process-status`, { processStatus: processStatus })
      .then(({ data }) => { })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
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
      }
      else {
        setCurrentStep(getIndex(data?.processStatus, invoiceProcessSteps));
      }
      setHeadingLabel(data.invoiceNumber);
      setCustomizedRoutes([routes.invoice, { title: `${data.invoiceNumber}` }]);
      setInvoiceData(data);
      var isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      if (user?.role?.selectedEntity?.superAdminAccess) {
        isAllowedToEdit = true;
      }
      setAllowedToEdit(isAllowedToEdit);
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

        const filename = response.headers["content-disposition"].split("filename=")[1];
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
    axiosInstance()
      .patch(`${invoice.api}/status/${invoiceData._id}`, { status: status })
      .then(({ data: { data } }) => {
        fetchInvoiceData();
        setShowClosedConfirmBox(false)
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Status changed to ${status}`
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
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
                {invoiceData?.versions?.length &&
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'outlined'}
                    color="primary"
                    size="small"
                    className={'btn-outline-v1'}
                    onClick={() => {
                      setVersionDialog(true)
                    }}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    startIcon={isMobile && !isTablet ? null : <VscVersions />}
                  >
                    {isMobile && !isTablet ? <VscVersions size={20} /> : 'Versions'}
                  </Button>
                }
                {permissions?.invoice?.isUpdate && allowedToEdit &&
                  ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status) && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      className={'btn-outline-v1'}
                      size="small"
                      onClick={handleOpenUpdateDialog}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                  )}
                {permissions?.invoice?.isDelete &&
                  ![INVOICE_STATUS.invoiced, INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status) &&
                  invoiceData?.canDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                {permissions?.invoice?.isUpdate && [INVOICE_STATUS.readyToInvoice, INVOICE_STATUS.invoiced].includes(invoiceData?.status) && (
                  <ButtonWithPulse
                    variant={'outlined'}
                    color="default"
                    size="small"
                    onClick={() => {
                      setShowClosedConfirmBox(true)
                    }}
                    className={'btn-outline-v1'}
                  >
                    Close
                  </ButtonWithPulse>
                )}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={invoiceData?._id}
              resource={ACTIVITY_RESOURCE.invoice}
              resourceLabel={invoiceData?.invoiceNumber}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              display: 'none'
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
              </div>
            }
            {...a11yProps(0)}
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            {...a11yProps(1)}
          />
          {permissions?.creditMemo?.isRead &&
            <Tab
              className={'tabLayout'}
              label={
                <div className="d-flex align-items-center tab-font">
                  <BiFoodMenu className="mr-1" fontSize="inherit" /> {routes.creditMemo.title}
                </div>
              }
              {...a11yProps(2)}
            />
          }
        </Tabs>

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
          <Steps
            isNextStep={false}
            nextStep={nextStep}
            steps={invoiceProcessSteps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            isStepEnded={[INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status)}
          />
          <ContentFullScreen title={invoiceProcessStepsNames[currentStep]} fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
            {currentStep === 0 && invoiceData && (
              <Material
                invoiceData={invoiceData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit && permissions?.invoice?.isUpdate ? true : false}
              />
            )}
            {currentStep === 1 && invoiceData && (
              <AdditionalCost
                invoiceData={invoiceData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
              />
            )}
            {currentStep === 2 && invoiceData && (
              <Invoice
                invoiceData={invoiceData}
                setNextStep={setNextStep}
                handleChangeStatus={handleChangeStatus}
                stepFullScreen={stepFullScreen}
                statusOptions={statusOptions}
              />
            )}
          </ContentFullScreen>
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <CreditMemo
            invoiceData={invoiceData}
            allowedToEdit={allowedToEdit && ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(invoiceData?.status)}
          />
        </TabPanel>
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
            handleChangeStatus(INVOICE_STATUS.closed)
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
            invoiceData();
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
            setVersionDialog(false)
          }}
        />
      )}
    </Box>
  );
};

export default InvoiceDetails;

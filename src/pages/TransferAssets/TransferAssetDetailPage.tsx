import React, {useState, useEffect, useContext, Fragment, useRef, useReducer} from 'react';
import { Grid, Box, Button, Paper, Tab, Tabs } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { transferAsset } from '../../constants/helpers';
import ManageTransferAsset from './ManageTransferAsset';
import DeleteButton from '../../components/Helpers/DeleteButton';
import queryString from 'query-string';
import TransferStepper from './TransferAssetSteps';
import AssetsGrid from './AssetsGrid';
import LoadingTicketGrid from './LoadingTicketGrid';
import ReceivingTicketGrid from './ReceivingTicketGrid';
import HideWhenOffline from "../../components/HideWhenOffline";
import { MdEdit, MdDelete } from 'react-icons/md';
import TabPanel from "../../components/TabPanel";
import {FaSuitcase, FaWpforms} from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import {isMobile} from "react-device-detect";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import {intialState, reducer} from "../../components/AgGridComponents/CustomAgGrid";

const transferSteps = ['Add Assets', 'Loading Ticket'];
const transferSteps1 = ['Add Assets', 'Loading Ticket', "Receiving Ticket"];

const TransferAssetDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const firstRender = useRef(true)

  const { id } = useParams();
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [transferAssetData, setTransferAssetData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [isNextStep, setNextStep] = useState(true);
  const [isPrevStep, setPrevStep] = useState(true);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [transferAssetFields, setTransferAssetFields] = useState([]);
  const [existingAssets, setExistingAssets] = useState([]);
  const [tickets, setTickets] = useState([])
  const [mainPoints, setMainPoints] = useState(null);
  const [plantId, setPlantId] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([])

  const [isTransferEnded, setTransferIsEnded] = useState(false);


  const {
    dataRows,
    rowCount,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
    appendRows,
    showFilteredRecordsOnly
  } = state;

  useEffect(() => {
    if (id) {
      fetchTransferAssetData();
      fetchAssets(true)
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
    } else {

      if (currentStep >= 0 && currentStep <= 1) {
        axiosInstance()
          .put(`${routes.transferAsset.path}/${id}/process-status`, { processStatus: transferSteps[currentStep] })
          .catch((error) => {
            toastConfig.setToastConfig(error);
          });
      }
    }
  }, [currentStep]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Transfer Asset Number'] = data.transferAssetNumber;
    mainPoint['Transfer Type'] = data.transferType;
    setMainPoints(mainPoint);
  };

  const getRessourceFields = (transferType) => {
    axiosInstance()
      .get('/field?resource=Transfer Asset')
      .then(({ data: { data } }) => {
        let fields = []
        data.forEach((field: any) => {

          if (transferType === "Internal") {
            if (field.fieldData.fieldName !== "transferToSupplier" && field.fieldData.fieldName !== "transferToCustomer"
              && field.fieldData.fieldName !== "supplierShipTo" && field.fieldData.fieldName !== "customerShipTo") {
              fields.push(field)
            }
          } else if (transferType === "External Supplier") {
            if (field.fieldData.fieldName !== "transferToPlant" && field.fieldData.fieldName !== "transferToCustomer"
              && field.fieldData.fieldName !== "plantShipTo" && field.fieldData.fieldName !== "customerShipTo") {
              fields.push(field)
            }
          } else if (transferType === "External Customer") {
            if (field.fieldData.fieldName !== "transferToSupplier" && field.fieldData.fieldName !== "transferToPlant"
              && field.fieldData.fieldName !== "plantShipTo" && field.fieldData.fieldName !== "supplierShipTo") {
              fields.push(field)
            }
          }
        })

        setTransferAssetFields(fields);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const fetchTransferAssetData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes.transferAsset.path}/${id}`)
      .then(({ data: { data } }) => {
        getRessourceFields(data?.transferType);
        setTransferAssetData(data);
        handleMainPoints(data);
        setPlantId(data?.transferFromPlant.optionValue);
        setHeadingLabel(data.transferAssetNumber);
        setCurrentStep(transferSteps.indexOf(data?.processStatus) !== -1 ? transferSteps.indexOf(data?.processStatus) : 0);
        setCustomizedRoutes([routes.transferAsset, { title: data.transferAssetNumber }]);

        if (permissions?.transferAsset?.isUpdate && openEdit === 'true') {
          setOpenUpdateDialog(true);
          const params = new URLSearchParams();
          params.delete('openEdit');
          history.push({ search: params.toString() });
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    setDeleting(true);
    axiosInstance()
      .put(`${transferAsset.api}/remove`, { ids: [id] })
      .then(() => {
        setDeleting(false);
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  /**
   * FETCH ASSETS FOR TRANSFER
   */

  const fetchAssets = (forceRefresh) =>
    new Promise((resolve, reject) => {
      if (existingAssets.length > 0 && !forceRefresh) {
        resolve(existingAssets);
      }

      if (existingAssets.length === 0 || forceRefresh) {
        axiosInstance()
          .get(`${routes.transferAsset.path}/get-asset/${id}`)
          .then(({ data: { data } }) => {
            setExistingAssets(data);
            resolve(data);
          })
          .catch((error) => {
            reject(error);
          });
      }
    });

  /**
   * Tab Change
   */
  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };
  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }


  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <div className="detail-container">
          <Paper>
            {!transferAssetData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.transferAsset?.isUpdate && (
                  <Button className="buttonStyleBigScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                )}
                {permissions?.transferAsset?.isUpdate && (
                  <Button className="buttonStyleSmallScreen" variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    <MdEdit size={24} />
                  </Button>
                )}
                {permissions?.transferAsset?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                <HideWhenOffline>
                  {permissions?.transferAsset?.isDelete &&
                    transferAssetData?.owner?.optionValue &&
                    user?.user?._id &&
                    transferAssetData?.owner.optionValue === user.user._id ? (
                    <DeleteButton
                      text="Delete"
                      className="buttonDeleteBigScreen"
                      onClick={() => setShowConfirmBox(true)}
                    />
                  ) : null}
                </HideWhenOffline>
                <HideWhenOffline>
                  {permissions?.transferAsset?.isDelete &&
                    transferAssetData?.owner?.optionValue &&
                    user?.user?._id &&
                    transferAssetData?.owner.optionValue === user.user._id ? (
                    <Button
                      className="buttonDeleteSmallScreen"
                      onClick={() => setShowConfirmBox(true)}
                    >
                      <MdDelete size={24} />
                    </Button>
                  ) : null}
                </HideWhenOffline>
              </DetailsPageHeader>
            )}

            <Tabs
              className="quote-tab"
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
                style={{
                  background: tabValue === 1 ? 'white' : '',
                  color: tabValue === 1 ? '#163340' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <FaWpforms className="mr-1" fontSize="inherit" /> Header
                  </div>
                }
                {...a11yProps(0)}
              />
              <Tab
                className={'tabLayout'}
                style={{
                  background: tabValue === 2 ? 'white' : '',
                  color: tabValue === 2 ? 'blue' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                  </div>
                }
                {...a11yProps(1)}
              />
              <div className={'uio'}> </div>
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box>
                {loading || !transferAssetData ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={transferAssetData} fields={transferAssetFields} />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box my={2}>

                    <TransferStepper
                        isInternal={transferAssetData?.transferType === "Internal"}
                        hasAssets={existingAssets.length > 0}
                        isTransferEnded={isTransferEnded}
                        isNextStep={isNextStep}
                        isPrevStep={isPrevStep}
                        steps={transferAssetData?.transferType === "Internal" ? transferSteps : transferSteps1}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                    />



                <Box my={1}>
                  {currentStep === 0 && (
                    <AssetsGrid
                      fetchAssets={fetchAssets}
                      currentStep={currentStep}
                      plantId={plantId}
                      transferAssetId={id}
                      permissions={permissions}
                      user={user}
                      setNextStep={setNextStep}
                      ownerId={transferAssetData?.createdBy.user._id}
                    />
                  )}
                  {currentStep === 1 && (
                    <LoadingTicketGrid
                      setTickets={setTickets}
                      currentStep={currentStep}
                      setPrevStep={setPrevStep}
                      transferAssetId={id}
                      transferAssetData={transferAssetData}
                      fetchAssets={fetchAssets}
                      plantId={plantId}
                      warehouse={transferAssetData?.transferFromPlant}
                      permissions={permissions}
                      setNextStep={setNextStep}
                      setTransferIsEnded={setTransferIsEnded}
                    />
                  )}
                  {currentStep === 2 && (
                    <ReceivingTicketGrid
                      setTickets={setTickets}
                      currentStep={currentStep}
                      setPrevStep={setPrevStep}
                      transferAssetId={id}
                      transferAssetData={transferAssetData}
                      fetchAssets={fetchAssets}
                      plantId={plantId}
                      warehouse={transferAssetData?.transferFromPlant}
                      permissions={permissions}
                      setNextStep={setNextStep}
                      setTransferIsEnded={setTransferIsEnded}
                    />
                  )}
                </Box>
              </Box>
            </TabPanel>



          </Paper>
        </div>
      </Fragment>
      {/* Confirm Delete Dialog */}
      {showConfirmBox && (
        <ConfirmationDialog
          okBtnLoading={isDeleting}
          open={showConfirmBox}
          message={`Are you sure you want to delete this transfer asset: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {/* Manage Transfer Asset Data */}
      {openUpdateDialog && (
        <ManageTransferAsset
          isEditable={existingAssets.length > 0}
          isMainInfoEditable={(currentStep >= 1 && tickets.length > 0)}
          number={transferAssetData?.transferAssetNumber}
          isClone={false}
          transferAssetId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchTransferAssetData();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default TransferAssetDetailPage;

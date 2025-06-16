import { Box, Menu, MenuItem } from '@mui/material';
import { camelCase } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useParams, useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import {
  ACTIVITY_RESOURCE,
  ASSEMBLY_ORDER_STATUS,
  assemblyOrderSteps,
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  getResourceNormalizeData,
  sidebarResource
} from 'src/constants/helpers';
import Steps, { getIndex } from 'src/components/Steps';
import { isMobile, isTablet } from 'react-device-detect';
import EditIcon from '@mui/icons-material/Edit';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { Skeleton } from '@mui/material';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import DetailsPage from 'src/components/Shared/DetailsPage';
import Step from 'src/pages/DynamicForm/Step';
import ManageAssemblyOrder from 'src/pages/AssemblyOrder/ManageAssemblyOrder';
import { dynamicFormUpdateProcessStatus } from 'src/pages/DynamicForm/helper';
import ContentFullScreen from 'src/components/ContentFullScreen';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import Material from 'src/pages/AssemblyOrder/Material';
import WorkOrder from 'src/pages/AssemblyOrder/WorkOrder';
import Loading from 'src/pages/AssemblyOrder/Loading';
import Invoice from 'src/pages/AssemblyOrder/Invoice';
import RoadmapViews from './RoadMapViews';
import ManageRentalManagementDialog from 'src/pages/RentalManagement/ManageRental';
import { ExpandMore } from '@mui/icons-material';
import { FaCircleChevronDown } from 'react-icons/fa6';

const AssemblyOrderDetail = () => {
  const renderedFrom = camelCase(sidebarResource.assemblyOrder);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();

  const parsed = queryString.parse(history.location.search);
  const { tab }: any = parsed;
  const {
    state: { user, permissions, resources }
  }: any = useData();

  const [assemblyOrderData, setAssemblyOrderData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [allFields, setAllFields] = useState([]);
  const [nextStep, setNextStep] = useState(true);
  const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [locationKeys, setLocationKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(null);
  const [stepFullScreen, setStepFullScreen] = useState(false);
  const [resourceData, setResourceData] = useState(null);
  const [openRentalDialog, setOpenRentalDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const assemblyOrderProcessStepsNames = useMemo(() => {
    return assemblyOrderSteps.map((item) => item.name);
  }, [assemblyOrderSteps]);

  useEffect(() => {
    return history.listen((location) => {
      const { tab }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key]);
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys);
          // Handle forward event
          setTabValue(tab ? parseInt(tab) : 1);
        } else {
          setLocationKeys((keys) => [location.key, ...keys]);
          // Handle back event
          setTabValue(tab ? parseInt(tab) : 1);
        }
      }
    });
  }, [locationKeys]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.assemblyOrder}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.assemblyOrder}`)
      .then(({ data: { data } }) => {
        setAllFields(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = () => {
    axiosInstance()
      .get(`${routes.assemblyOrder.path}/${id}`)
      .then(({ data: { data } }) => {
        if ([ASSEMBLY_ORDER_STATUS.converted]?.includes(data?.status)) {
          setCurrentStep(assemblyOrderSteps?.length - 1);
        } else {
          setCurrentStep(getIndex(data?.processStatus, assemblyOrderSteps));
        }

        setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.assemblyOrder, data) && data?.status != ASSEMBLY_ORDER_STATUS.converted);
        setAllowedToDelete(
          permissions?.assemblyOrder?.isDelete &&
          checkIsAllowedToDelete(user, sidebarResource.assemblyOrder, data.owner.optionValue) &&
          data?.canDelete &&
          ![ASSEMBLY_ORDER_STATUS.converted, ASSEMBLY_ORDER_STATUS.partiallyConverted]?.includes(data?.status)
        );
        setAssemblyOrderData({ ...data });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${routes.assemblyOrder.path}/remove`, { ids: [id] })
      .then(() => {
        setShowDeleteConfirmBox(false);
        history.push(routes.assemblyOrder.path);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowDeleteConfirmBox(false);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
    history.push(`?tab=${newValue}`);
    if (newValue === 0) {
      fetchData();
    }
  };

  const convertToRental = (rentalData) => {
    axiosInstance()
      .put(`${routes?.assemblyOrder?.path}/convert-to-rental`, { assemblyOrder: id, rentalManagement: rentalData?._id })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message || ''
        });
        setOpenRentalDialog(false);
        fetchData();
        window.open(`${routes.rentalManagementDetail.path}/${rentalData?._id}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const showConvertInRentalJob = () => {
    if (!assemblyOrderData?.canConvert) {
      return false
    }
    let show = false
    if (assemblyOrderData?.rentalJob?.length > 0) {
      if (!resourceData?.policy?.autoConvertInSameRentalJob && (permissions?.rentalManagement?.isUpdate || permissions?.rentalManagement?.isCreate)) {
        show = true
      }
    } else {
      if (permissions?.rentalManagement?.isCreate) {
        show = true
      }
    }
    return show
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs
            routes={[{ ...routes.assemblyOrder, title: resources?.assemblyOrder?.titlePlural }, { title: assemblyOrderData?.assemblyOrderNumber }]}
          />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {assemblyOrderData ? (
              <>
                {showConvertInRentalJob() ? (
                  <ThemeButton
                    onClick={(event) => {
                      if (assemblyOrderData?.rentalJob?.length > 0) {
                        setAnchorEl(event.currentTarget);
                      } else {
                        setOpenRentalDialog(true)
                      }
                    }}
                    aria-controls="convert-to-rental-job-menu"
                    endIcon={assemblyOrderData?.rentalJob?.length > 0 ? <ExpandMore fontSize="small" /> : <></>}
                  >
                    {`Convert to ${resources?.rentalManagement?.titleSingular}`}
                  </ThemeButton>
                ) : null}
                <Menu
                  id="convert-to-rental-job-menu"
                  anchorEl={anchorEl}
                  keepMounted
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  {permissions?.rentalManagement?.isUpdate && (
                    <>
                      {assemblyOrderData?.rentalJob?.map(r => {
                        return (
                          <MenuItem
                            onClick={() => {
                              setAnchorEl(null);
                              convertToRental({ _id: r?.optionValue })
                            }}
                          >
                            {`Add to ${r?.optionLabel}`}
                          </MenuItem>
                        )
                      })}
                    </>
                  )}
                  {permissions?.rentalManagement?.isCreate && (
                    <MenuItem
                      onClick={() => {
                        setAnchorEl(null);
                        setOpenRentalDialog(true)
                      }}
                    >
                      {`Add to New ${resources?.rentalManagement?.titleSingular}`}
                    </MenuItem>
                  )}
                </Menu>
                {permissions?.assemblyOrder?.isUpdate && allowedToEdit && (
                  <ThemeButton iconForMobile={<EditIcon />} onClick={() => setOpenUpdateDialog(true)} mobileTooltip={'Edit'}>
                    {'Edit'}
                  </ThemeButton>
                )}
                {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowDeleteConfirmBox(true)} />}
              </>
            ) : (
              <Skeleton variant="text" width="150px" height="32px" />
            )}
            <ActivityButton
              referenceId={assemblyOrderData?._id}
              resource={ACTIVITY_RESOURCE.assemblyOrder}
              resourceLabel={assemblyOrderData?.assemblyOrderNumber}
              resourceData={assemblyOrderData}
            />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
          {!(isMobile && !isTablet) && <CustomTab value={2} label={'Views'} />}
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 3}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {assemblyOrderData && allFields.length ? (
              <DetailsPage
                data={assemblyOrderData}
                fields={allFields}
                resource={sidebarResource?.assemblyOrder}
                referenceId={assemblyOrderData?._id}
              />
            ) : (
              <div className="p-2">
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </div>
            )}
          </Box>
        </TabPanel>
        <ContentFullScreen fullScreen={stepFullScreen} setFullScreen={setStepFullScreen}>
          <TabPanel value={tabValue} index={1}>
            <Steps
              isNextStep={false}
              nextStep={nextStep}
              steps={assemblyOrderSteps}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isStepEnded={assemblyOrderData?.status === ASSEMBLY_ORDER_STATUS.converted}
              stepFullScreen={stepFullScreen}
              setStepFullScreen={() => setStepFullScreen(!stepFullScreen)}
              updateStatus={(step: number) => {
                dynamicFormUpdateProcessStatus(sidebarResource.assemblyOrder, assemblyOrderProcessStepsNames[step], id);
              }}
            />
            {assemblyOrderProcessStepsNames[currentStep] === 'Add' && assemblyOrderData && (
              <Material
                assemblyOrderData={assemblyOrderData}
                setNextStep={setNextStep}
                renderedFrom={`${renderedFrom}_grid-1`}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                fetchAssembleOrderData={fetchData}
              />
            )}
            {assemblyOrderProcessStepsNames[currentStep] === 'Work Order' && assemblyOrderData && (
              <WorkOrder
                renderedFrom={`${renderedFrom}_grid-2`}
                assemblyOrderData={assemblyOrderData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
                setCurrentStep={setCurrentStep}
                nextStep={nextStep}
                fetchAssembleOrderData={fetchData}
              />
            )}
            {/* {assemblyOrderProcessStepsNames[currentStep] === 'Loading' && assemblyOrderData && (
              <Loading
                renderedFrom={`${renderedFrom}_grid-3`}
                assemblyOrderData={assemblyOrderData}
                setNextStep={setNextStep}
                stepFullScreen={stepFullScreen}
                allowedToEdit={allowedToEdit}
              />
            )} */}
            {assemblyOrderProcessStepsNames[currentStep] === 'Final Slip' && assemblyOrderData && (
              <Invoice renderedFrom={`${renderedFrom}_grid-4`} assemblyOrderData={assemblyOrderData} stepFullScreen={stepFullScreen} />
            )}
          </TabPanel>
        </ContentFullScreen>
        <TabPanel value={tabValue} index={2}>
          <Box>{assemblyOrderData && <RoadmapViews assemblyOrderNumber={assemblyOrderData?.assemblyOrderNumber} id={id} />}</Box>
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
                  resource={sidebarResource.assemblyOrder}
                  data={assemblyOrderData}
                  allowedToEdit={permissions?.assemblyOrder?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete this ${resources?.assemblyOrder?.titleSingular?.toLowerCase()}: ${assemblyOrderData?.assemblyOrderNumber} ?`}
          onClose={() => {
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}

      {openUpdateDialog && (
        <ManageAssemblyOrder
          isClone={false}
          assemblyOrderId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchData();
            setOpenUpdateDialog(false);
          }}
        />
      )}

      {openRentalDialog && (
        <ManageRentalManagementDialog
          isClone={false}
          rentalManagementId={null}
          onClose={() => {
            setOpenRentalDialog(false);
          }}
          onSuccess={convertToRental}
          open={true}
          referenceData={getResourceNormalizeData(
            allFields?.map((e) => e?.fieldData),
            assemblyOrderData,
            assemblyOrderData?.currency
          )}
        />
      )}
    </Box>
  );
};

export default AssemblyOrderDetail;

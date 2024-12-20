import { Box, Button, Grid, Menu, MenuItem } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import routes from 'src/components/Helpers/Routes';
import { checkIsAllowedToDelete, checkIsAllowedToEdit, INVOICE_STATUS, sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageCreditMemo from './ManageCreditMemo';
import Step from '../DynamicForm/Step';
import { CustomOfflineContext } from 'src/StateProvider/OfflineContext/OfflineContext';
import Material from './Material';
import { isMobile, isTablet } from 'react-device-detect';
import { Edit, ExpandMore } from '@material-ui/icons';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { RiExchangeBoxFill } from 'react-icons/ri';
import { Skeleton } from '@material-ui/lab';

const creditMemoDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.creditMemo]);
  const [creditMemoData, setCreditMemoData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const { isOffline } = useContext(CustomOfflineContext);
  const [resourceData, setResourceData] = useState(null);
  const [statusOptions, setStatusOptions] = useState([]);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);
  const [showReOpenConfirmBox, setShowReOpenConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  const {
    state: { user, permissions, resources }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
      fetchPolicy();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.creditMemo}`)
      .then(({ data }) => {
        data?.data.forEach((o: any) => {
          if (o?.fieldData?.fieldName === 'status') {
            setStatusOptions([...o.fieldData.option]);
          }
        });
        setFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.creditMemo.path}/${id}`);
      setCreditMemoData(data);
      setCustomizedRoutes([{ ...routes.creditMemo, title: resources?.creditMemo?.titlePlural }, { title: data?.creditMemoNumber }]);
      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.creditMemo, data));
      setAllowedToDelete(permissions?.creditMemo?.isDelete && checkIsAllowedToDelete(user, sidebarResource.creditMemo, data?.owner?.optionValue) && data?.canDelete);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      if (permissions?.creditMemo?.isDelete) {
        axiosInstance()
          .put(`${routes.creditMemo.path}/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: data?.message
            });
            history.push(`${routes.creditMemo.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchPolicy = async () => {
    try {
      if (!isOffline) {
        const {
          data: { data }
        } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.creditMemo}`);
        if (data) {
          setResourceData(data);
        }
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleChangeStatus = (status) => {
    setUpdateLoading(true);
    const creditMemos = [
      {
        _id: creditMemoData._id,
        prevStatus: creditMemoData?.status
      }
    ];
    axiosInstance()
      .put(`${routes.creditMemo.path}/update-status`, { status: status, creditMemos: creditMemos })
      .then(({ data: { data } }) => {
        fetchData();
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
    const currIdx = statusOptions.findIndex((status) => status.optionValue === creditMemoData.status);
    return statusOptions[currIdx + 1]?.optionValue !== status;
  };


  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {creditMemoData ? (
              <>
                {permissions?.creditMemo?.isUpdate && allowedToEdit && statusOptions?.length > 0 && (
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
                {permissions?.creditMemo?.isUpdate &&
                  allowedToEdit &&
                  ![INVOICE_STATUS.closed, INVOICE_STATUS.cancelled].includes(creditMemoData?.status) && (
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
                {permissions?.creditMemo?.isUpdate && allowedToEdit && creditMemoData?.status === INVOICE_STATUS.closed && (
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
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0} label={'Header'} />
          <CustomTab value={1} label={'Details'} />
          {resourceData && resourceData?.tabs?.length > 0 && resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 2}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={creditMemoData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Box>
            <Material creditMemoData={creditMemoData} allowedToEdit={permissions?.creditMemo?.isUpdate} fetchCreditMemoData={fetchData} />
          </Box>
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
                  resource={sidebarResource.creditMemo}
                  data={creditMemoData}
                  allowedToEdit={permissions?.creditMemo?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.creditMemo?.titleSingular?.toLowerCase()} : ${creditMemoData?.creditMemoNumber} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {showReOpenConfirmBox && (
        <ConfirmationDialog
          open={showReOpenConfirmBox}
          message={`Are you sure you want to re-open ${creditMemoData?.creditMemoNumber} ?`}
          onClose={() => {
            setShowReOpenConfirmBox(false);
          }}
          onOk={() => {
            handleChangeStatus(INVOICE_STATUS.invoiced);
          }}
        />
      )}
      {openUpdateDialog && (
        <ManageCreditMemo
          creditMemoId={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default creditMemoDetail;

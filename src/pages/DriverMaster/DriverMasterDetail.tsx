import { Box, Button, Grid, Menu, MenuItem } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import History from './History';
import ManageDriverMaster from './ManageDriverMaster';
import { useTableReducer } from 'src/components/CustomReactTable';

const DriverMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const { state } = useTableReducer();
  const { selectedRecords } = state;
  const [driverMasterData, setDriverMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const {
    state: { permissions, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.driverMaster, title: resources?.driverMaster?.titlePlural }]);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.driverMaster}`)
      .then(({ data }) => {
        setFields(data.data?.filter((field) => field.isRead));
        if (data.data && data.data.length) {
          data.data.some((o) => {
            if (o?.fieldData?.fieldName === 'status') {
              setStatusOptions([...o.fieldData.option]);
              return true;
            }
          });
        }
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
      } = await axiosInstance().get(`${routes.driverMaster.path}/${id}`);
      setDriverMasterData(data);
      setCustomizedRoutes([{ ...routes.driverMaster, title: resources?.driverMaster?.titlePlural }, { title: data?.driverName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.driverMaster?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.driverMaster.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
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

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeStatus = async (status) => {
    try {
      let res = await axiosInstance().patch(`${routes.driverMaster?.path}/status/${id}`, { status: status });
      const historyBody = {
        driver: id,
        referenceType: sidebarResource?.driverMaster,
        referenceId: id,
        status: status,
        comments: `Changed Status to ${status}`
      };
      await axiosInstance().post(`${routes.driverMaster.path}/history/${id}`, historyBody);
      toastConfig.setToastConfig({
        open: true,
        type: 'success',
        message: res.data.message
      });
      fetchData();
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.driverMaster?.isUpdate && (
                <Button
                  variant={'outlined'}
                  color="primary"
                  aria-controls="simple-menu"
                  aria-haspopup="true"
                  size="small"
                  onClick={handleClick}
                  endIcon={<ArrowDropDownIcon />}
                  className="btn-outline-v1"
                >
                  {'Change Status'}
                </Button>
              )}
              <Menu
                id="simple-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                getContentAnchorEl={null}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                {driverMasterData &&
                  statusOptions?.map((o, index) => {
                    return (
                      <MenuItem
                        disabled={o?.optionLabel === driverMasterData?.status ? true : false}
                        onClick={() => {
                          handleClose();
                          handleChangeStatus(o?.optionLabel);
                        }}
                        value={o}
                      >
                        {o?.optionLabel}
                      </MenuItem>
                    );
                  })}
              </Menu>
              {permissions?.driverMaster?.isUpdate && (
                <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.driverMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab value={0}>
            Details
          </CustomTab>
          <CustomTab value={1}>
            History
          </CustomTab>
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={driverMasterData} fields={fields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <History id={id} status={driverMasterData?.status} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${selectedRecords?.length ? `${resources?.driverMaster?.titleSingular?.toLowerCase()} :
            ${driverMasterData.driverName}` : resources?.driverMaster?.titlePlural?.toLowerCase()} ?`}  
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageDriverMaster
          id={id}
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

export default DriverMasterDetail;

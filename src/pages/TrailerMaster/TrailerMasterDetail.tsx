import { Box, Button, Grid, Menu, MenuItem, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageTrailerMaster from './ManageTrailerMaster';
import { sidebarResource } from 'src/constants/helpers';
import TabPanel from '../../components/TabPanel';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { FaWpforms } from 'react-icons/fa';
import History from './History';

const TrailerMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user }
  }: any = useData();

  const [trailerMasterData, setTrailerMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [statusOptions, setStatusOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.trailerMaster}`)
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
      } = await axiosInstance().get(`${routes.trailerMaster.path}/${id}`);
      setTrailerMasterData(data);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.trailerMaster?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.goBack();
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
      let res = await axiosInstance().patch(`${routes.trailerMaster?.path}/status/${id}`, { status: status });
      const historyBody = {
        trailer: id,
        referenceType: sidebarResource?.trailerMaster,
        referenceId: id,
        status: status,
        comments: `Changed Status to ${status}`
      };
      await axiosInstance().post(`${routes.trailerMaster.path}/history/${id}`, historyBody);
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
          <CustomBreadCrumbs routes={[routes.trailerMaster, { title: trailerMasterData?.trailerName }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
          {permissions?.trailerMaster?.isUpdate && (
              <Button
                variant={'outlined'}
                color="primary"
                aria-controls="simple-menu"
                aria-haspopup="true"
                size="small"
                onClick={handleClick}
                endIcon={<ArrowDropDownIcon />}
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
              {trailerMasterData &&
                statusOptions?.map((o, index) => {
                  return (
                    <MenuItem
                      disabled={o?.optionLabel === trailerMasterData?.status ? true : false}
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
            {permissions?.trailerMaster?.isUpdate && (
              <Button variant={isMobile && !isTablet ? 'text' : 'contained'} className="btn-outline-v1" onClick={handleOpenUpdateDialog}>
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.trailerMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Tabs
          className="new-tab-container-v1"
          value={tabValue}
          onChange={handleMainTabChange}
          textColor="primary"
          TabIndicatorProps={{
            style: {
              height: 0
            }
          }}
        >
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            value={0}
            aria-controls="a11y-tabpanel-0"
            id="a11y-tab-0"
          />
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <BiFoodMenu className="mr-1" fontSize="inherit" /> History
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={trailerMasterData} fields={fields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <History id={id} status={trailerMasterData?.status} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.trailerMaster?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTrailerMaster
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

export default TrailerMasterDetail;

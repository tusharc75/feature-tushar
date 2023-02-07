import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Typography, Paper } from '@material-ui/core';
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
import CreateZone from './CreateZone';
import DeleteButton from '../../components/Helpers/DeleteButton';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Zipcode from './zip';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

const ZoneDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [activeTable, setActiveTable] = useState('Details');
  const [tabValue, setTabValue] = useState(0);
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoneData, setZoneData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [zoneFields, setZoneFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);

  useEffect(() => {
    if (id) {
      getZoneFields();
      fetchZoneData();
    }
  }, [id]);

  const fetchZoneData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/zone/${id}`);
      handleMainPoints(data);
      setHeadingLbl(data.name);
      setZoneData(data);
      setCustomizedRoutes([routes.zone, { title: data.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data?.name}`,
      taxJurisdiction: data.taxJurisdiction || ''
    };
    setMainPoints(tempMp);
  };

  const getZoneFields = () => {
    axiosInstance()
      .get('/field?resource=Zone')
      .then(({ data }) => {
        setZoneFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteZone = () => {
    if (id) {
      if (permissions?.zone?.isDelete) {
        axiosInstance()
          .put(`/zone/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.goBack();
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
    if (newValue === 1) {
      setActiveTable('Pincode');
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
            {permissions?.zone?.isUpdate && (
              <Button variant="contained" className={'btn-outline-v1'} size="small" onClick={handleOpenUpdateDialog}>
                Edit
              </Button>
            )}
            {permissions?.zone?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
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
              height: 0
            }
          }}
        >
          <Tab label={<div className="tab-font">Details</div>} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" className={'tabLayout'} />
          <Tab label={<div className="tab-font">Zip Code</div>} aria-controls="a11y-tabpanel-1" id="a11y-tab-1" className={'tabLayout'} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !zoneFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={zoneData} fields={zoneFields} />
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Zipcode id={id} />
        </TabPanel>
      </Box>
      {openUpdateDialog && (
        <CreateZone
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          // fetchData={() => {
          //   fetchZoneData();
          // }}
          zoneId={id}
          isUpdateDisabled={false}
          isClone={false}
          onSuccess={() => {
            fetchZoneData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes.zone.title.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteZone}
        />
      )}
    </Box>
  );
};

export default ZoneDetailPage;

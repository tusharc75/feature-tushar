import { Box, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import CreateZone from './CreateZone';
import Zipcode from './zip';

const ZoneDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
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
      setCustomizedRoutes([{ ...routes.zone, title: resources?.zone?.titlePlural }, { title: data.name }]);
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

            history.push(`${routes.zone.path}`);
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
              <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                {'Edit'}
              </ThemeButton>
            )}
            {permissions?.zone?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab label={'Details'} value={0} />
          <CustomTab label={'Zip Code'} value={1} />
        </CustomTabs>

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
          message={`Are you sure you want to delete ${resources?.zone?.titleSingular?.toLowerCase()} : ${headingLbl}?`}
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

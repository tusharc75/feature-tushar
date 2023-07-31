import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Tabs, Tab } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ManageWellMaster from './ManageWellMaster';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { ACTIVITY_RESOURCE, wellMaster } from 'src/constants/helpers';
import ActivityButton from 'src/components/Activity/ActivityButton';
import WellNumber from './WellNumber';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit } from 'react-icons/bi';

const WellMasterDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [wellMasterData, setWellMasterData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [wellMasterFields, setWellMasterFields] = useState([]);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [tabValue, setTabValue] = useState(0);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.wellMaster]);

  useEffect(() => {
    if (id) {
      getWellMasterFields();
      fetchWellMasterData();
    }
  }, [id]);

  const fetchWellMasterData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${wellMaster.api}/${id}`);
      setHeadingLbl(data.wellName);
      setWellMasterData(data);
      setCustomizedRoutes([routes.wellMaster, { title: data.wellName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const getWellMasterFields = () => {
    axiosInstance()
      .get('/field?resource=Well Master')
      .then(({ data }) => {
        setWellMasterFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteWellMaster = () => {
    axiosInstance()
      .put(`${wellMaster.api}/remove`, { ids: [id] })
      .then(({ data }) => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.wellMaster?.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                className={`btn-outline-v1`}
                size="small"
                onClick={() => {
                  if (permissions?.wellMaster?.isUpdate) {
                    setShowManageDialog({ open: true, isClone: false, idToClone: wellMasterData._id });
                  }
                }}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.wellMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton 
              referenceId={wellMasterData?._id} 
              resource={ACTIVITY_RESOURCE.wellMaster} 
              resourceLabel={wellMasterData?.wellName}
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
              height: 0
            }
          }}
        >
          <Tab label={<div className="tab-font">Details</div>} value={0} aria-controls="a11y-tabpanel-0" id="a11y-tab-0" className={'tabLayout'} />
          {permissions?.wellNumber?.isRead && (
            <Tab
              label={<div className="tab-font">Well Number</div>}
              value={1}
              aria-controls="a11y-tabpanel-1"
              id="a11y-tab-1"
              className={'tabLayout'}
            />
          )}
        </Tabs>
        {tabValue === 0 && (
          <Box>
            {loading || !wellMasterFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={wellMasterData} fields={wellMasterFields} />
            )}
          </Box>
        )}
        {tabValue === 1 && <WellNumber wellName={id} />}
      </Box>
      {showManageDialog.open && (
        <ManageWellMaster
          isClone={showManageDialog.isClone}
          wellMasterId={showManageDialog.idToClone}
          onClose={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
            fetchWellMasterData();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes.wellMaster.title.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteWellMaster}
        />
      )}
    </Box>
  );
};

export default WellMasterDetailsPage;

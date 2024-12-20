import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { ACTIVITY_RESOURCE, wellMaster } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import ManageWellMaster from './ManageWellMaster';
import WellNumber from './WellNumber';

const WellMasterDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [wellMasterData, setWellMasterData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [wellMasterFields, setWellMasterFields] = useState([]);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [tabValue, setTabValue] = useState(0);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.wellMaster, title: resources?.wellMaster?.titlePlural }]);

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
      setCustomizedRoutes([{ ...routes.wellMaster, title: resources?.wellMaster?.titlePlural }, { title: data.wellName }]);
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
        history.push(`${routes.wellMaster.path}`);
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
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {permissions?.wellMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            <ActivityButton referenceId={wellMasterData?._id} resource={ACTIVITY_RESOURCE.wellMaster} resourceLabel={wellMasterData?.wellName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange}>
          <CustomTab label={'Details'} value={0} />
          {permissions?.wellNumber?.isRead && <CustomTab label={resources?.wellNumber?.titlePlural} value={1} />}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !wellMasterFields.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={wellMasterData} fields={wellMasterFields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <WellNumber wellName={id} />
        </TabPanel>
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
          message={`Are you sure you want to delete ${resources?.wellMaster?.titleSingular.toLowerCase()} : ${headingLbl}?`}
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

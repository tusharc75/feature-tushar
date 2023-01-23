import { Box, Button, Grid, Tab, Tabs } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Skeleton } from '@material-ui/lab';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit, BiFoodMenu } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageSurveys from './ManageSurveys';
import FieldDialog from './FieldDialog';
import SurveysData from './SurveysData';
import { FaWpforms } from 'react-icons/fa';

const SurveysDetail = () => {
  const { id } = useParams();
  const [stepFieldsDialog, setStepFieldsDialog] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [headingLbl, setHeadingLbl] = useState('');
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.surveys]);
  const [SurveyData, setSurveyData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [allowedToEdit, setAllowedToEdit] = useState(false);
  const [allowedToDelete, setAllowedToDelete] = useState(false);

  const {
    state: { permissions, user }
  }: any = useData();

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Surveys')
      .then(({ data }) => {
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
      } = await axiosInstance().get(`/surveys/${id}`);
      const isAllowedToEdit = [...(data.collaborator ?? []), data.owner].some((d) => d?.optionValue === user?.user?._id);
      setAllowedToEdit(isAllowedToEdit);
      setAllowedToDelete(data?.owner?.optionValue === user?.user?._id);
      setHeadingLbl(data.surveyName);
      setSurveyData(data);
      setCustomizedRoutes([routes.surveys, { title: data?.surveyName }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`/surveys/remove`, { ids: [id] })
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="controls-buttons-v1">
            {!SurveyData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <>
                {permissions.surveys?.isUpdate && allowedToEdit && (
                  <>
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      className={'btn-outline-v1'}
                      onClick={handleOpenUpdateDialog}
                      style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    >
                      {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                    </Button>
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      className={'btn-outline-v1'}
                      onClick={(e) => {
                        setStepFieldsDialog(true);
                      }}
                      style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                    >
                      Fields
                    </Button>
                  </>
                )}
                {permissions?.surveys?.isDelete && allowedToDelete && SurveyData?.canDelete && (
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                )}
              </>
            )}
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
          <Tab
            className={'tabLayout'}
            label={
              <div className="d-flex align-items-center tab-font">
                <FaWpforms className="mr-1" fontSize="inherit" /> Header
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
                <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
              </div>
            }
            value={1}
            aria-controls="a11y-tabpanel-1"
            id="a11y-tab-1"
          />
        </Tabs>
        {tabValue === 0 && (
          <Box>
            {loading || !fields?.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(7).keys()]} />
              </Grid>
            ) : (
              <DetailsPage data={SurveyData} fields={fields} />
            )}
          </Box>
        )}
        {tabValue === 1 && <SurveysData surveyId={id} />}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes?.surveys?.title?.toLowerCase()} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageSurveys
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
      {stepFieldsDialog && (
        <FieldDialog
          surveyId={id}
          handleClose={() => {
            setStepFieldsDialog(false);
          }}
          handleSuccess={() => {
            setStepFieldsDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default SurveysDetail;

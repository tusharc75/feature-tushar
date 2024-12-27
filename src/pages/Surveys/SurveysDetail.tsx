import { Box, Grid } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import FieldDialog from './FieldDialog';
import ManageSurveys from './ManageSurveys';
import SurveysData from './SurveysData';
import { checkIsAllowedToDelete, checkIsAllowedToEdit, sidebarResource } from 'src/constants/helpers';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';

const SurveysDetail = () => {
  const { id } = useParams();
  const [stepFieldsDialog, setStepFieldsDialog] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
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
    state: { permissions, user, resources }
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

      setAllowedToEdit(checkIsAllowedToEdit(user, sidebarResource.surveys, data));
      setAllowedToDelete(
        permissions?.surveys?.isDelete && checkIsAllowedToDelete(user, sidebarResource.surveys, data.owner.optionValue) && data?.canDelete
      );
      setSurveyData(data);
      setCustomizedRoutes([{ ...routes.surveys, title: resources?.surveys?.titlePlural }, { title: data?.surveyName }]);
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
          history.push(`${routes.surveys.path}`);
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
          <Box className="control-buttons-v1">
            {permissions?.surveys?.isUpdate && allowedToEdit && (
              <ThemeButton
                onClick={(e) => {
                  setStepFieldsDialog(true);
                }}
                mobileTooltip={'Edit'}
              >
                {'Fields'}
              </ThemeButton>
            )}
            {permissions?.surveys?.isUpdate && allowedToEdit && (
              <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                {'Edit'}
              </ThemeButton>
            )}
            {allowedToDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs className="new-tab-container-v1" value={tabValue} onChange={handleMainTabChange} textColor="primary">
          <CustomTab value={0}>Header</CustomTab>
          <CustomTab value={1}>Details</CustomTab>
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={SurveyData} fields={fields} />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <SurveysData surveyId={id} />
        </TabPanel>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.surveys?.titleSingular?.toLowerCase()} : ${SurveyData?.surveyName} ?`}
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

import { Box, Button, Grid, Paper } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { Skeleton } from '@material-ui/lab';
import DetailsPageHeader from 'src/components/DetailsPageHeader';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit } from 'react-icons/bi';
import DeleteButton from 'src/components/Helpers/DeleteButton';
import { useData } from 'src/StateProvider/Provider';
import { useParams, useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import DetailsPage from '../../components/Shared/DetailsPage';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ManageSurveys from './ManageSurveys';
import FieldDialog from '../ServiceMaster/Steps/FieldDialog';

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
    const {
      state: { permissions }
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


      const handleFieldSave = (data) =>{
        const body = {
            _id:id,
            fields:data
        }
        axiosInstance().put('/surveys',body)
        .then((data)=>{
         fetchData()
        }).catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }

  return (
    <Fragment>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
          <Paper>
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
              <DetailsPageHeader heading={headingLbl} showHeading={true}>
                <>
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    onClick={handleOpenUpdateDialog}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>

                  <Box component="span" marginX={1} />

                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    color="primary"
                    size="small"
                    onClick={(e)=>{
                setStepFieldsDialog(true);
                        
                    }}
                    style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                  >
                    Fields
                  </Button>

                  <Box component="span" marginX={1} />
                  <span title={id ? "Primarily selected  can't be deleted" : 'Permanently delete'}>
                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                  </span>
                </>
              </DetailsPageHeader>
            )}
            <Box>
              {loading || !fields?.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <DetailsPage data={SurveyData} fields={fields} />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
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
          serviceId={id}
          stepIds={''}
          steps={[]}
          handleClose={() => {
            setStepFieldsDialog(false);
          }}
          handleSucess={(data) => {
            setStepFieldsDialog(false);
            handleFieldSave(data)
          }}
          fields={SurveyData.fields || []}
          reference='surveys'
        />
      )}
    </Fragment>
  )
}

export default SurveysDetail
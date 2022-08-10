import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { serviceMaster } from '../../constants/helpers';
import ManageServiceMaster from './ManageServiceMaster';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import accountClass from '../Account/account.module.scss';
import DeleteButton from '../../components/Helpers/DeleteButton';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import LeadTimeMaster from '../../components/LeadTime';
import Configuration from './Configuration/index';
import Steps from './Steps';

const ServiceMasterDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();

  const [serviceMasterDetailData, setServiceMasterDetailData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [id]);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${serviceMaster.resource}`)
      .then(({ data }) => {
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    setLoading(true);
    axiosInstance()
      .get(`${serviceMaster.api}/${id}`)
      .then(({ data: { data } }) => {
        setServiceMasterDetailData(data);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${serviceMaster.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.serviceMaster, { title: `${serviceMasterDetailData?.serviceName || ''}` }]} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Paper style={{ height: '650px' }}>
            <DetailsPageHeader heading={serviceMasterDetailData?.serviceName || ''} mainPoints={null} showHeading={true}>
              {permissions?.product?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  color="primary"
                  size="small"
                  onClick={() => {
                    setOpenUpdateDialog(true);
                  }}
                  className={isMobile && !isTablet ? accountClass.mobile_button_layout : ''}
                  style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
                >
                  {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                </Button>
              )}
              {permissions?.serviceMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </DetailsPageHeader>
            <Box>
              {loading || (!fields.length && serviceMasterDetailData != null) ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <DetailsPage data={serviceMasterDetailData} fields={fields} />
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4}>
          <Box mb={2}>
            <Steps serviceId={id} />
          </Box>
          {permissions?.leadTimeMaster?.isRead && (
            <Box mb={2}>
              <LeadTimeMaster Id={id} type={'service'} />
            </Box>
          )}

          <Box mb={2}>
            <Configuration id={id} type={'service'} />
          </Box>
        </Grid>
      </Grid>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.serviceMaster?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageServiceMaster
          isClone={false}
          serviceMasterId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Fragment>
  );
};

export default ServiceMasterDetailsPage;

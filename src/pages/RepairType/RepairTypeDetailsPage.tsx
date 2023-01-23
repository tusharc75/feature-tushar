import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button, Paper, Typography } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { repairType } from '../../constants/helpers';
import ManageRepairType from './ManageRepairType';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from '../../components/Helpers/DeleteButton';

const RepairTypeDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();

  const [repairTypeData, setRepairTypeData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState([]);

  useEffect(() => {
    fetchFields();
    fetchData();
  }, [id]);

  const fetchFields = () => {
    axiosInstance()
      .get(`/field?resource=${repairType.resource}`)
      .then(({ data }) => {
        setFields(data.data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchData = async () => {
    axiosInstance()
      .get(`${repairType.api}/${id}`)
      .then(({ data: { data } }) => {
        setRepairTypeData(data);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${repairType.api}/remove`, { ids: [id] })
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
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={[routes.repairType, { title: repairTypeData?.repairType }]} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.repairType?.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                onClick={() => {
                  setOpenUpdateDialog(true);
                }}
                className={'btn-outline-v1'}
                style={isMobile && !isTablet ? { color: '#43aeaa' } : {}}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.repairType?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className='detail-container-v1'>
        <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Paper style={{ height: '650px' }}>
            <Box>
              {repairTypeData && fields.length ? (
                <DetailsPage data={repairTypeData} fields={fields} />
              ) : (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={12} md={4} lg={4}>
          <Paper style={{ overflow: 'hidden' }}>
            <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Repair Steps</Typography>
            </Box>
            {repairTypeData?.steps?.map((steps, index) => (
              <Box key={index} bgcolor="white" p={1} borderTop={1} borderColor="grey.300" width={'100%'}>
                <Grid container>
                  <Grid item xs={2} sm={2} md={2} lg={2}>
                    <Typography variant="body2">{steps.order}</Typography>
                  </Grid>
                  <Grid item xs={10} sm={10} md={10} lg={10}>
                    <Typography variant="body2">{steps.name}</Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Paper>
        </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${routes.repairType?.title} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageRepairType
          isClone={false}
          repairTypeId={id}
          onClose={() => setOpenUpdateDialog(false)}
          onSuccess={() => {
            setOpenUpdateDialog(false);
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default RepairTypeDetailsPage;

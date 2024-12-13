import { Box, Button, Grid, Typography } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { repairType } from '../../constants/helpers';
import ManageRepairType from './ManageRepairType';

const RepairTypeDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
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
        history.push(`${routes.repairType.path}`);
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
          <CustomBreadCrumbs routes={[{ ...routes.repairType, title: resources?.repairType?.titlePlural }, { title: repairTypeData?.repairType }]} />
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
              >
                {isMobile && !isTablet ? <Edit /> : 'Edit'}
              </Button>
            )}
            {permissions?.repairType?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Grid container spacing={1}>
          <Grid item xs={12} sm={12} md={8} lg={8}>
            <div style={{ height: '650px' }}>
              <Box>
                {repairTypeData && fields.length ? (
                  <DetailsPage data={repairTypeData} fields={fields} />
                ) : (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                )}
              </Box>
            </div>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4}>
            <div className="single-form-v1">
              <Box className="form-head-v1">
                <Typography component={'h3'}>Repair Steps</Typography>
              </Box>
              <Box className="formdata-v1">
                {repairTypeData?.steps?.map((steps, index) => (
                  <>
                    <Box key={index} p={1} borderTop={1} borderColor="var(--common-border-color)" width={'100%'}>
                      <Grid container>
                        <Grid item xs={2} sm={2} md={2} lg={2}>
                          <Typography variant="body2">{steps.order}</Typography>
                        </Grid>
                        <Grid item xs={10} sm={10} md={10} lg={10}>
                          <Typography variant="body2">{steps.name}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </>
                ))}
              </Box>
            </div>
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this ${resources?.repairType?.titleSingular} ?`}
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

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
import ManageTaxMaster from './ManageTaxMaster';

const TaxMasterDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [taxMasterData, setTaxMasterData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.taxMaster, title: resources?.taxMaster?.titlePlural }]);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get('/field?resource=Tax Master')
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
      } = await axiosInstance().get(`${routes.taxMaster.path}/${id}`);
      setTaxMasterData(data);
      setCustomizedRoutes([{ ...routes.taxMaster, title: resources?.taxMaster?.titlePlural }, { title: data?.taxCode }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.taxMaster?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);

          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.taxMaster.path}`);
        })
        .catch((err) => {
          setShowConfirmBox(false);
        });
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            <>
              {permissions?.taxMaster?.isUpdate && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} tooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.taxMaster?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
          </Box>
        </Box>
      </Box>
      <Box className="detail-container-v1">
        <Box>
          {loading || !fields?.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={taxMasterData} fields={fields} />
          )}
        </Box>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.taxMaster?.titleSingular?.toLowerCase()} : ${taxMasterData?.taxCode} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageTaxMaster
          id={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
        />
      )}
    </Box>
  );
};

export default TaxMasterDetail;

import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import EditIcon from '@mui/icons-material/Edit';
import { useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import { ACTIVITY_RESOURCE, sidebarResource } from '../../constants/helpers';
import ManageMarketSegmentDialog from './ManageMarketSegmentDialog';

const MarketSegmentDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, user, resources }
  }: any = useData();
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.marketSegment, title: resources?.marketSegment?.titlePlural }]);
  const [marketSegmentData, setMarketSegmentData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);

  useEffect(() => {
    if (id) {
      fetchFields();
      fetchData();
    }
  }, [id]);

  const fetchFields = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.marketSegment}`)
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
      } = await axiosInstance().get(`${routes?.marketSegment?.path}/${id}`);
      setMarketSegmentData(data);
      setCustomizedRoutes([{ ...routes.marketSegment, title: resources?.marketSegment?.titlePlural }, { title: data?.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleDelete = () => {
    if (id) {
      axiosInstance()
        .put(`${routes?.marketSegment?.path}/remove`, { ids: [id] })
        .then(({ data }) => {
          setShowConfirmBox(false);
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data?.message
          });
          history.push(`${routes.marketSegment.path}`);
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
              {permissions?.marketSegment?.isUpdate && (
                <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                  {'Edit'}
                </ThemeButton>
              )}
              {permissions?.marketSegment?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
            </>
            <ActivityButton referenceId={marketSegmentData?._id} resource={ACTIVITY_RESOURCE.marketSegment} resourceLabel={marketSegmentData?.name} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {loading || !fields?.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Grid>
        ) : (
          <DetailsPage data={marketSegmentData} fields={fields} />
        )}
      </Box>
      {openUpdateDialog && (
        <ManageMarketSegmentDialog
          marketSegmentId={id}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            closeUpdateDialog();
            fetchData();
          }}
          isClone={false}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.marketSegment?.titleSingular?.toLowerCase()} : ${fields?.name} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
    </Box>
  );
};

export default MarketSegmentDetail;

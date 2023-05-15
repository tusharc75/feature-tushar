import { useState, useEffect, useContext } from 'react';
import { Grid, Box, Button } from '@material-ui/core';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { ACTIVITY_RESOURCE, sidebarResource } from '../../constants/helpers';
import { BiEdit } from 'react-icons/bi';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteButton from '../../components/Helpers/DeleteButton';
import { Skeleton } from '@material-ui/lab';
import ManageMarketSegmentDialog from './ManageMarketSegmentDialog';
import ActivityButton from 'src/components/Activity/ActivityButton';

const MarketSegmentDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [headingLbl, setHeadingLbl] = useState('');
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([routes.marketSegment]);
  const [marketSegmentData, setMarketSegmentData] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
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
      setHeadingLbl(data.name);
      setMarketSegmentData(data);
      setCustomizedRoutes([routes.marketSegment, { title: data?.name }]);
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
          history.goBack();
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
                  <Button
                    variant={isMobile && !isTablet ? 'text' : 'contained'}
                    size="small"
                    onClick={handleOpenUpdateDialog}
                    className={'btn-outline-v1'}
                  >
                    {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
                  </Button>
                )}
                {permissions?.marketSegment?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </>
              <ActivityButton referenceId={marketSegmentData?._id} resource={ACTIVITY_RESOURCE.marketSegment} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        {loading || !fields?.length ? (
          <Grid container spacing={2} style={{ padding: '8px' }}>
            <CommonSkeleton lenArray={[...Array(7).keys()]} />
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
          message={`Are you sure you want to delete ${routes?.marketSegment?.title?.toLowerCase()} ?`}
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

import React, { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Typography, Paper } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CreateInventoryCycle from './CreateInventoryCycle';
import DeleteButton from '../../components/Helpers/DeleteButton';

const InventoryCycleDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
  const [inventoryCycleFields, setInventoryCycleFields] = useState([]);
  const [inventoryCycleResource, setInventoryCycleResource] = useState(null);
  const [inventoryCycleData, setInventoryCycleData] = useState(null);

  useEffect(() => {
    if (id) {
      getInventoryCycleFields();
      fetchInventoryCycleData();
    }
  }, [id]);

  const getInventoryCycleFields = () => {
    axiosInstance()
      .get('/field?resource=Inventory Cycle')
      .then(({ data }) => {
        setInventoryCycleFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const fetchInventoryCycleData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/inventory-cycle/${id}`);
      handleMainPoints(data);
      setHeadingLbl(data.cycleCode);
      setInventoryCycleData(data);
      setInventoryCycleResource({ id: data._id });
      setCustomizedRoutes([routes.inventoryCycle, { title: data.cycleCode }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data?.name}`,
      taxJurisdiction: data.taxJurisdiction || ''
    };
    setMainPoints(tempMp);
  };

  const handleDeleteInventoryCycle = () => {
    if (id) {
      if (permissions?.address?.isDelete) {
        axiosInstance()
          .put(`/inventory-cycle/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.goBack();
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
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
    <>
      {openUpdateDialog && (
        <CreateInventoryCycle
          isUpdateDisabled={false}
          inventoryCycleId={id}
          isClone={false}
          onClose={closeUpdateDialog}
          onSuccess={() => {
            fetchInventoryCycleData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${routes.inventoryCycle.title.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteInventoryCycle}
        />
      )}
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
            <Paper>
              {!inventoryCycleData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={headingLbl} mainPoints={null} showHeading={true}>
                  {/* {permissions?.inventoryCycle?.isUpdate && (
                    <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  <Box component="span" />
                  {permissions?.inventoryCycle?.isDelete && (
                    <span title={id ? "Primarily selected inventoryCycle can't be deleted" : 'Permanently delete this inventoryCycle'}>
                      <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                    </span>
                  )} */}
                  <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                  <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                </DetailsPageHeader>
              )}
              <Box>
                {loading || !inventoryCycleFields.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={inventoryCycleData} fields={inventoryCycleFields} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Fragment>
    </>
  );
};

export default InventoryCycleDetailPage;

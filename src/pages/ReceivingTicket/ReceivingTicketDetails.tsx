import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Typography, IconButton, Paper, Chip } from '@material-ui/core';
import { ControlPoint, ExpandLess, ExpandMore } from '@material-ui/icons';
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
import { receivingTicket } from '../../constants/helpers';
import ManageReceivingTicket from './ManageReceivingTicket';
import BoxWithBorder from '../../components/BoxWithBorder';
import DeleteButton from '../../components/Helpers/DeleteButton';

const ReceivingTicketDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [receivingTicketData, setReceivingTicketData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [receivingTicketFields, setReceivingTicketFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);

  useEffect(() => {
    if (id) {
      fetchReceivingTicketData()
    }
    // eslint-disable-next-line
  }, [id]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Receiving Job Name'] = data?.receivingJobName || '';
    mainPoint['Delivery Person'] = data?.deliveryPerson.optionLabel || '';
    mainPoint['Status'] = data?.status || '';
    setMainPoints(mainPoint);
  };

  const getRessourceFields = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Receiving Ticket')
      .then(({ data: { data } }) => {
        setReceivingTicketFields(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
        toastConfig.setToastConfig(err);
      });
  };

  const fetchReceivingTicketData = () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes.receivingTicket.path}/${id}`)
      .then(({ data: { data } }) => {
        setReceivingTicketData(data)
        handleMainPoints(data)
        setHeadingLabel(data.receivingJobName);
        setCustomizedRoutes([routes.receivingTicket, { title: data.receivingJobName }]);
        getRessourceFields();
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${receivingTicket.receivingTicketApi}/remove`, { ids: [id] })
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
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
            <Paper>
              {!receivingTicketData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                  {permissions?.receivingTicket?.isUpdate && (
                    <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                      Edit
                    </Button>
                  )}
                  {permissions?.receivingTicket?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
                </DetailsPageHeader>
              )}

              <Box>
                {loading || !receivingTicketFields.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={receivingTicketData} fields={receivingTicketFields} />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}></Grid>
        </Grid>
      </Fragment>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this receiving Ticket: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManageReceivingTicket
          open={openUpdateDialog}
          isClone={false}
          receivingTicketId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            getRessourceFields();
            setOpenUpdateDialog(false);
          }}
        />
      )}
    </>
  );
};

export default ReceivingTicketDetails;

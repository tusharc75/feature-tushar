import { Skeleton } from '@material-ui/lab';
import { Box, Button, Grid, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import axios from 'axios';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { FaFileSignature } from 'react-icons/fa';
import { useHistory, useParams } from 'react-router-dom';
import { SVG } from '../../assets';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import DetailsPage from '../../components/Shared/DetailsPage';
import { backendApi } from '../../config';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ViewSignsDialog from './ViewSignsDialog';

const useStyles = makeStyles(() => ({
  header: {
    background: '#163340',
    textAlign: 'center',
    padding: '10px',
    color: 'white',
    boxShadow: '1px 4px 5px #7c7979'
  },
  logo: {
    width: '140px'
  },
  brandLogo: {
    height: '45px',
    borderRadius: '3px'
  },
  footer: {
    position: 'fixed',
    bottom: '7px',
    background: '#ecfcef',
    width: '100%',
    padding: '10px',
    display: 'flex',
    alignItems: 'center'
  },
  gridContent: {
    height: 'calc(100vh - 24vh)',
    width: '100%',
    marginTop: '10px',
    overflow: 'auto'
  }
}));

const CustomerSign = () => {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [openSignatureDialog, setOpenSignatureDialog] = useState(false);
  const [submittingSign, setSubmittingSign] = useState(false);
  const [openSigns, setOpenSigns] = useState(false);

  const deliveryTicketFields = [
    {
      fieldData: {
        _id: '61c1b6120620c62e3b986763',
        fieldName: 'ticketName',
        fieldLabel: 'Ticket Name',
        required: true,
        type: 'singleLine',
        sectionName: 'Delivery Information',
        isTooltip: false,
        order: 1,
        resource: 'Delivery Ticket'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '61c1b6120620c62e3b986764',
        fieldLabel: 'Ticket Type',
        type: 'singleLine',
        sectionName: 'Delivery Information',
        fieldName: 'ticketType',
        roleType: 2,
        resource: 'Delivery Ticket',
        isDefault: true
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '61c1b6120620c62e3b986765',
        fieldLabel: 'Delivery Person',
        type: 'singleLine',
        required: true,
        sectionName: 'Delivery Information',
        fieldName: 'deliveryPerson'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '61c1b6120620c62e3b986766',
        fieldLabel: 'Type',
        type: 'singleLine',
        required: false,
        sectionName: 'Delivery Information',
        fieldName: 'type'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    },
    {
      fieldData: {
        _id: '61c1b6120620c62e3b986767',
        fieldLabel: 'Rental Job',
        type: 'singleLine',
        required: false,
        sectionName: 'Delivery Information',
        fieldName: 'rentalJob'
      },
      isCreate: true,
      isRead: true,
      isUpdate: true
    }
  ];

  useEffect(() => {
    if (id) {
      fetchDeliveryTicketData();
    }
  }, [id]);

  const fetchDeliveryTicketData = async () => {
    setLoading(true);
    axios
      .get(backendApi + `/delivery-ticket/get-delivery-by-id/${id}`)
      .then(async ({ data }) => {
        setLoading(false);
        data.data['deliveryPerson'] = data.data?.deliveryPerson?.optionLabel;
        data.data['rentalJob'] = data.data?.rentalJob?.optionLabel;
        setDeliveryTicketData(data.data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSignature = (signedData) => {
    setSubmittingSign(true);
    axios
      .put(backendApi + `/delivery-ticket/update-customer-signature`, {
        deliveryTicketId: id,
        signature: signedData.sign
      })
      .then(async ({ data }) => {
        setOpenSignatureDialog(false);
        setSubmittingSign(false);
        fetchDeliveryTicketData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.data
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOpenSignatureDialog(false);
        setSubmittingSign(false);
      });
  };

  return (
    <>
      <Grid container className={classes.header}>
        <Grid item xs={12} md={1} sm={2}>
          <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
        </Grid>
        <Grid item xs={6} md={2} sm={2} className="pull-right"></Grid>
      </Grid>
      <Fragment>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
            <Paper>
              {!deliveryTicketData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                    <Box marginX={1} />
                    <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  </Box>
                </div>
              ) : (
                <Typography
                  className="text-capitalize"
                  style={{ display: 'flex', justifyContent: 'center' }}
                  variant="h6"
                  component="h2"
                  color="primary"
                  id="detailHeaderPageTitle"
                >
                  <span className="d-flex align-items-center">
                    <span className="listingHeader">
                      {' '}
                      {deliveryTicketData?.signatures?.length === 4 ? 'Please Sign-in ' : 'Customer has been successfully signed in'}
                    </span>
                  </span>
                </Typography>
              )}
              <Box>
                {loading || !deliveryTicketFields.length || !deliveryTicketData ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <DetailsPage data={deliveryTicketData} fields={deliveryTicketFields} />
                )}
              </Box>
            </Paper>

            <Box display="flex" marginTop={2} justifyContent="flex-end" p="4px">
              {deliveryTicketData?.signatures?.length === 4 && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  color="primary"
                  size="medium"
                  disabled={loading}
                  style={isMobile && !isTablet ? { color: 'var(--warning-darken)' } : {}}
                  onClick={() => setOpenSignatureDialog(true)}
                >
                  {isMobile && !isTablet ? <FaFileSignature size={18} /> : 'Customer Signature'}
                </Button>
              )}
              {/* {deliveryTicketData?.signatures?.some(d => d.type === "customer") && <Button
                                variant={isMobile && !isTablet ? "text" : "contained"}
                                color="primary"
                                size="medium"
                                onClick={() => setOpenSigns(true)}
                                style={isMobile && !isTablet ? { color: "var(--info-darken)" } : {}}
                            >
                                {isMobile && !isTablet ? <FaSignature size={20} /> : "View Signatures"}
                            </Button>
                            } */}
            </Box>
          </Grid>
        </Grid>
      </Fragment>
      {openSignatureDialog && (
        <SignatureDialog
          submitting={submittingSign}
          label={'Customer Sign'}
          steps={['Customer Sign']}
          forDelivery={true}
          open={true}
          onClose={() => {
            setOpenSignatureDialog(false);
          }}
          onSigned={handleSignature}
        />
      )}
      {openSigns && <ViewSignsDialog signatures={deliveryTicketData?.signatures} close={() => setOpenSigns(false)} />}
    </>
  );
};

export default CustomerSign;

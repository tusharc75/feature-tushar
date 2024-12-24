import { Box, Button, Grid, TextField } from '@mui/material';
import { makeStyles } from '@mui/styles';
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { sidebarResource } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { SVG } from '../../assets';
import { backendApi } from './../../config';
import IrtTicket from './IrtTicket';
import QuotationCustomerAccept from './QuotationCustomer/QuotationCustomerAccept';
import QuotationSupplierPrice from './QuotationSupplierPrice';
import QuoteSupplierPrice from './QuoteSupplierPrice';

const useStyles = makeStyles((theme) => ({
  header: {
    background: '#163340',
    textAlign: 'center',
    paddingLeft: '22px',
    paddingTop: '5px',
    paddingBottom: '5px',
    color: 'white',
    boxShadow: '1px 4px 5px #7c7979'
  },
  logo: {
    paddingTop: '8px',
    width: '120px'
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
  },
  warningIcon: {
    display: 'inline-flex'
  }
}));

const PublicRoutePage = () => {
  const { id } = useParams();
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(true);
  const [resourceData, setResourceData] = useState(null);
  const [passwordVerification, setPasswordVerification] = useState(false);
  const [password, setPassword] = useState(null);
  const [validPassword, setValidPassword] = useState(true);
  const [referenceType, setReferenceType] = useState('');

  useEffect(() => {
    if (id) {
      fetchLinkData();
    }
  }, [id]);

  const fetchLinkData = async () => {
    setLoading(true);
    axios
      .get(backendApi + `/public/check-link/${id}`)
      .then(async ({ data }) => {
        setReferenceType(data?.data?.referenceType);
        if (data?.data?.referenceType === 'QuotationCustomer' || data?.data?.referenceType === 'RentalJob') {
          document.title = 'Equipt Customer Portal';
        } else {
          document.title = 'Equipt Supplier Portal';
        }
        if (data?.data?.valid) {
          if (data?.data?.protected) {
            setPasswordVerification(true);
          } else {
            fetchResourceData();
          }
        } else {
          setValid(false);
        }
      })
      .catch((error) => {
        setValid(false);
      });
  };

  const fetchResourceData = () => {
    let tempData = {
      id: id
    };
    if (password) tempData['password'] = password;
    axios
      .post(backendApi + `/public/get-data`, tempData)
      .then(async ({ data }) => {
        setResourceData(data.data);
        setReferenceType(data?.data?.referenceIdType);
        setPasswordVerification(false);
        setLoading(false);
      })
      .catch((error) => {
        setValidPassword(false);
        toastConfig.setToastConfig({
          message: `Password is not correct`,
          type: 'error',
          open: true
        });
      });
  };

  useEffect(() => {
    document.title = referenceType === 'QuotationCustomer' || referenceType === 'RentalJob' ? 'Equipt Customer Portal' : 'Equipt Supplier Portal';
  }, [resourceData?.referenceIdType]);

  return (
    <div className="m-0 block h-screen w-screen max-w-[100vw] overflow-hidden">
      <div className={`${classes.header} flex items-center justify-between`}>
        <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
        <h2 style={{ paddingTop: '10px', paddingRight: '10px', color: 'white', textAlign: 'right' }}>
          {referenceType === 'QuotationCustomer' || referenceType === 'RentalJob' ? 'Customer Portal' : 'Supplier Portal'}
        </h2>
      </div>
      <div className="max-h-[calc(100vh-54px)] max-w-[calc(100vw-10px)] overflow-auto">
        {passwordVerification ? (
          <Box style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
            <Box style={{ marginTop: '50px', width: '400px' }} boxShadow={3}>
              <Grid spacing={1} style={{ padding: '10px', display: 'flex', justifyContent: 'center' }} container>
                <Grid item xs={12} sm={12} md={12}>
                  <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={'Authentication Required'}>
                    Authentication Required
                  </h1>
                </Grid>
                <Grid item xs={10} sm={10} md={10}>
                  <TextField
                    id="outlined-full-width"
                    margin="normal"
                    variant="outlined"
                    InputLabelProps={{
                      shrink: true
                    }}
                    label="Password"
                    name="Password"
                    type="password"
                    placeholder="Please enter password"
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={10} sm={10} md={10}>
                  <Button style={{ marginBottom: '20px' }} variant="contained" color="primary" size="medium" fullWidth onClick={fetchResourceData}>
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        ) : !valid ? (
          <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'center', color: '#047d1c' }} title={' Thanks for your submission'}>
            Link is expired or already used
          </h1>
        ) : loading || resourceData ? (
          resourceData?.referenceIdType === 'Quotes' ? (
            <QuoteSupplierPrice quoteData={resourceData} openAuthId={id} />
          ) : resourceData?.referenceIdType === 'Quotation' ? (
            <QuotationSupplierPrice openAuthData={resourceData?.data} openAuthId={id} />
          ) : resourceData?.referenceIdType === 'QuotationCustomer' ? (
            <QuotationCustomerAccept openAuthId={id} />
          ) : resourceData?.referenceIdType === sidebarResource.irtTicket ? (
            <IrtTicket openAuthId={id} openAuthData={resourceData?.data} />
          ) : (
            <Box p={2}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )
        ) : (
          <Box p={2}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </div>
    </div>
  );
};

export default PublicRoutePage;

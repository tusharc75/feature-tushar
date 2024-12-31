import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { SVG } from '../../assets';
import axiosInstance from '../../axios/axiosInstance';
import SignatureDialog from '../../components/Helpers/SignatureDialog';
import DOAReasonDialog from '../DOA/DOAReasonDialog';
import { backendApi } from './../../config';
import CodeValidation from './CodeValidation';
import styles from './quote-approval.module.scss';
import { ThemeButton } from 'src/components/Helpers/Buttons';

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

const QuoteApproval = () => {
  let location = useLocation().search;

  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();

  const { id } = useParams();
  const [replied, setReplied] = useState(false);
  const [validQuote, setValidQuote] = useState(true);
  const [logo, setLogo] = useState(null);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [currency, setCurrency] = useState('');
  const [showQuoteStatusChangeDialog, setShowQuoteStatusChangeDialog] = useState(false);
  const [quoteStatusChangeData, setQuoteStatusChangeData] = useState('');
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [versionDetails, setVersionDetails] = useState(null);
  const [pdf, setPdf] = useState('');
  const [showAcceptRejectButtons, setShowAcceptRejectButtons] = useState(false);
  const [showUnlockAction, setShowUnlockAction] = useState(true);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    fetchQuote();
  }, []);

  //to fetch Quote Data from QuoteID
  const fetchQuote = () => {
    axios
      .get(backendApi + '/quote-builder/getQuotefromId/' + id + location)
      .then(async ({ data }) => {
        setPdf(data.brand.pdf);

        if (data.Quote_Status === 'Sent to Customer') {
          setLogo(data.logo);
          setSellingPrice(data.TotalSellingPriceamount);
          setCurrency(data.TotalSellingPricecurr);

          setQuoteData(data.quoteDetail);
          setVersionDetails(data.versionDetails);
        } else if (data.Quote_Status === 'Accepted by Customer' || data.Quote_Status === 'Rejected by Customer') {
          setReplied(true);
        } else {
          setValidQuote(false);
        }
      })
      .catch(() => {
        setValidQuote(false);
      });
  };

  const QuoteStatusChange = (accepted, signedDocumentBase64, comment) => {
    let body;
    if (accepted !== 'Rejected') {
      body = { status: 'Accepted by Customer', signature: signedDocumentBase64, token: token };
    } else {
      body = { status: 'Rejected by Customer', comment: comment, token: token };
    }
    axios
      .post(backendApi + '/quote-builder/updateStatusfromCustomer/' + id + location, body)
      .then(() => {
        setReplied(true);
        setShowQuoteStatusChangeDialog(false);
        setShowSignatureDialog(false);
      })
      .catch(() => {
        setShowQuoteStatusChangeDialog(false);
        setShowSignatureDialog(false);
      });
  };

  const handleSave = (values) => {
    axiosInstance()
      .post(`quote-builder/verify-otp/${id}/${versionDetails.versionNumber}`, {
        otp: values.code
      })
      .then(({ data: { data } }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: 'Succesfully Validated'
        });
        if (data.token) {
          setShowValidationDialog(false);
          setShowUnlockAction(false);
          setShowAcceptRejectButtons(true);
          setToken(data.token);
        }
      })
      .catch((err) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'error',
          message: 'Entered otp does not matched'
        });
      });
  };
  return (
    <div>
      {validQuote ? (
        <div>
          {replied ? (
            <Grid container className={classes.header}>
              <Grid size={{ xs: 12, md: 1, sm: 2 }}>
                <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
              </Grid>
              <Grid size={{ xs: 6, md: 9, sm: 8 }} className="d-flex align-items-center justify-content-center">
                <h1>Thanks, Response for the Quote has been sent.</h1>
              </Grid>
              <Grid size={{ xs: 6, md: 2, sm: 2 }}>
                {logo && <img src={logo} alt="brand" className={classes.brandLogo} />}
              </Grid>
            </Grid>
          ) : (
            <div>
              <Grid container className={classes.header}>
                <Grid size={{ xs: 12, md: 1, sm: 2 }}>
                  <img className={classes.logo} src={SVG('LogoNew')} alt="equip logo" title="eQuipt Logo" />
                </Grid>
                <Grid size={{ xs: 6, md: 9, sm: 8 }} className="d-flex align-items-center justify-content-center">
                  <h1>Approve Quote: {quoteData?.name}</h1>
                </Grid>
                <Grid size={{ xs: 6, md: 2, sm: 2 }} className="pull-right"></Grid>
              </Grid>

              {pdf ? (
                <object style={{ height: 'calc(100vh - 200px)', width: '100vw' }} data={`data:application/pdf;base64,${pdf}`} type="application/pdf">
                  <span className="d-flex align-items-center">This browser does not support PDF preview. Try with another browser.</span>
                </object>
              ) : (
                ''
              )}

              <div className={styles.main}>
                <div className="mt-1">
                  <Grid container alignItems="center">
                    <Grid size={{ xs: 12, md: 4, sm: 4 }}>
                      <h2>
                        Total : {sellingPrice.toFixed(2)} {currency}
                      </h2>
                    </Grid>
                    {showUnlockAction && (
                      <Grid size={{ xs: 12, md: 8, sm: 8 }} className="centerItem d-flex" justifyContent="flex-end">
                        <HtmlTooltip title="Click to unlock accept/reject options">
                          <ThemeButton
                            buttonType="transparent"
                            disabled={!Boolean(versionDetails)}
                            onClick={() => {
                              setShowValidationDialog(true);
                            }}
                          >
                            Unlock
                          </ThemeButton>
                        </HtmlTooltip>
                      </Grid>
                    )}

                    {showAcceptRejectButtons && (
                      <Grid size={{ xs: 12, md: 8, sm: 8 }} className="centerItem d-flex" justifyContent="flex-end">
                        <ThemeButton
                          buttonType="theme"
                          className="mr-1"
                          onClick={() => setShowSignatureDialog(true)}
                        >
                          Accept
                        </ThemeButton>
                        <ThemeButton
                          buttonType="theme"
                          onClick={() => {
                            setQuoteStatusChangeData('Rejected');
                            setShowQuoteStatusChangeDialog(true);
                          }}
                        >
                          Reject
                        </ThemeButton>
                      </Grid>
                    )}
                  </Grid>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h1>Link Expired.</h1>
        </div>
      )}
      {showValidationDialog && (
        <CodeValidation
          open={showValidationDialog}
          title="Unlock Actions"
          close={() => setShowValidationDialog(false)}
          handleSave={handleSave}
          email={versionDetails.email.to[0]}
          versionNumber={versionDetails.versionNumber}
          quoteId={id}
        />
      )}
      {showQuoteStatusChangeDialog && (
        <DOAReasonDialog
          reasonDialogOpen={showQuoteStatusChangeDialog}
          handleCloseDialog={() => setShowQuoteStatusChangeDialog(false)}
          QuoteStatusChange={QuoteStatusChange}
          accepted={quoteStatusChangeData}
        />
      )}

      {showSignatureDialog && (
        <SignatureDialog
          open={showSignatureDialog}
          onSigned={(imageData) => {
            QuoteStatusChange(true, imageData, null);
          }}
          onClose={() => {
            setShowSignatureDialog(false);
          }}
        />
      )}
    </div>
  );
};

export default QuoteApproval;

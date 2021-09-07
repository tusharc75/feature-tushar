import React, { useContext, useEffect, useMemo, useState, useReducer, Fragment } from 'react'
import { useHistory, useParams, useLocation } from "react-router-dom";
import { Paper, Box, Grid } from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import DetailsPageHeader from "../../components/DetailsPageHeader";
import { yyyyMMDD, formatAmountWithCurrency, deliveryTicket } from "../../constants/helpers";
import Activity from "../../components/Activity";
import { useData } from "../../StateProvider/Provider";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import routes from "../../components/Helpers/Routes";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { isMobile, isTablet } from "react-device-detect";
import { IoIosArrowDropright, IoIosArrowDropleft } from 'react-icons/io';
import QuoteDetailPage from './DeliveryDetailPage';

export default function DeliveryTicketDetail(props) {
  const history = useHistory();
  const location = useLocation();
  const toastConfig = useContext(CustomToastContext);
  const { id } = useParams();
  const {
    state: { selectedEntity },
  }: any = useData();
  const [deliveryTicketData, setDeliveryTicketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { deliveryTicketApi } = deliveryTicket;
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showActivity, setActivityShow] = useState(true);

  const handleActivityHideShow = () => {
    setActivityShow(!showActivity)
  }
  useEffect(() => {
    fetchDeliveryTicketData();
  }, [id]);

  const getMainPoints = useMemo(() => {
    let mainPoint = {};
    if (deliveryTicketData) {
      mainPoint["Account Name"] = deliveryTicketData?.accountName?.optionLabel || "";
      mainPoint["Expiry Date"] = yyyyMMDD(deliveryTicketData?.closeDate);
      mainPoint["Estimated Amount"] = deliveryTicketData?.estimatedAmount
        ? formatAmountWithCurrency(deliveryTicketData?.currency, deliveryTicketData?.estimatedAmount)
          .shortFormatAmount
        : "";
      mainPoint["Quote Owner"] = deliveryTicketData?.owner?.optionLabel || "";
    }
    return mainPoint;
  }, [deliveryTicketData?.accountName, deliveryTicketData?.closeDate, deliveryTicketData?.estimatedAmount, deliveryTicketData?.currency, deliveryTicketData?.owner,]);


  const fetchDeliveryTicketData = () => {
    if (selectedEntity) {
      setLoading(true);
      axiosInstance()
        .get(`${deliveryTicketApi}/${id}?entity=${selectedEntity}`)
        .then(({ data: { data } }) => {
          setDeliveryTicketData(data)
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setLoading(false);
        });
    }
  };

  const handleDeleteQuote = () => {
    if (deliveryTicketData?._id) {
      axiosInstance()
        .put(`${deliveryTicketApi}/remove?entity=${selectedEntity}`, {
          ids: [deliveryTicketData._id],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          history.push({
            pathname: routes.quoteBuilder.path,
          });
          setShowConfirmBox(false);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowConfirmBox(false);
        });
    } else {
      setShowConfirmBox(false);
    }
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={[routes.deliveryTicket]} />
        </Grid>
        <div className={`detail-container ${showActivity ? 'grid-with-activity' : 'grid-without-activity'}`} >
          <div>
            <Paper>
              {!deliveryTicketData ? (
                <div>
                  <Skeleton variant="text" width="150px" height="40px" />
                  <Box display="flex">
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                    <Box marginX={1} />
                    <Skeleton
                      style={{ borderRadius: 6 }}
                      width="120px"
                      height="80px"
                    />
                  </Box>
                </div>
              ) : (
                <DetailsPageHeader
                  heading={deliveryTicketData ? deliveryTicketData.quoteName : ""}
                  logo={deliveryTicketData?.leadLogo ? deliveryTicketData.leadLogo : undefined}
                  mainPoints={deliveryTicketData ? getMainPoints : ""}
                  showHeading={true}
                >
                </DetailsPageHeader>
              )}

              {loading ? (
                <Box padding={2}>
                  <Grid container spacing={2}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <Grid item sm={6} md={6} key={i}>
                        <Skeleton variant="text" width="100px" height="16px" />
                        <Box marginY={1} />
                        <Skeleton width="100%" height="50px" />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ) : (
                <>
                  {(deliveryTicketData && <QuoteDetailPage
                    deliveryTicketData={deliveryTicketData}
                    selectedEntity={selectedEntity}
                  />)}
                </>
              )}
            </Paper>
          </div>
          <div className="position-relative">
            {showActivity ?
              <Paper>
                {!isMobile && !isTablet && <a color="primary" className="activityHide" onClick={handleActivityHideShow}>
                  <IoIosArrowDropright className="icon" />
                </a>}
                {!deliveryTicketData ? (
                  <Box>
                    <Skeleton variant="text" width="100px" height="25px" />
                    <Box marginY={1} />
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} width="100%" height="50px" />
                    ))}
                  </Box>
                ) : (
                  <div>
                    <Activity
                      resourceId={deliveryTicketData?._id}
                      resource={deliveryTicket.deliveryTicketResource}
                      restrictedAddActivities={["Attachment", "Case"]}
                      relatedTo={[
                        {
                          type: deliveryTicket.deliveryTicketResource,
                          referenceId: deliveryTicketData?._id,
                          access: true,
                        },
                      ]}
                      handleActivityRefresh={() => { }}
                      //   emails={contactsEmailsData}
                      emails={null}
                    />
                  </div>
                )}
              </Paper> :
              !isMobile && !isTablet && <a className="activityShow" onClick={handleActivityHideShow}>
                <IoIosArrowDropleft className="icon" />
              </a>}
          </div>
        </div>
        {showConfirmBox ? (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this Quote?`}
            onClose={() => setShowConfirmBox(false)}
            onOk={handleDeleteQuote}
          />
        ) : null}

      </Fragment>
    </>
  );
}

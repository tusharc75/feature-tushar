import { Box, Button, Container } from "@material-ui/core";
import { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";
import DetailsPage from '../../../components/Shared/DetailsPage';

const IrtTicket = ({ openAuthId, openAuthData }) => {

  const toastConfig = useContext(CustomToastContext);
  const [irtTicketData, setIrtTicketData] = useState(null);
  const [fields, setFields] = useState(null);

  useEffect(() => {
    fetchData();
  }, [openAuthId]);


  const fetchData = () => {
    axiosInstance()
      .get(`${routes.irtTicket.path}/approver/public/${openAuthId}`)
      .then(({ data: { data } }) => {
        setIrtTicketData(data?.irtTicket)
        setFields(data?.fields)
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  const submitResponce = (status) => {
    const data = {
      user: openAuthData?.user,
      status: status,
      comment: "ROMTI",
      openAuthId: openAuthId
    }
    axiosInstance().post(`${routes.irtTicket.path}/approver/public/response/${irtTicketData?._id}`, data)
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Your response has been submitted successfully.`
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  return (
    <>
      {fields && fields?.length && irtTicketData ?
        <Container>
          <Box pt={3}>
            <DetailsPage data={irtTicketData} fields={fields} />
            <Box pt={2} style={{ textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  submitResponce("Approved")
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  submitResponce("Rejected")
                }}
              >
                Reject
              </Button>
            </Box>
          </Box>
        </Container> : null
      }
    </>
  );
};

export default IrtTicket;

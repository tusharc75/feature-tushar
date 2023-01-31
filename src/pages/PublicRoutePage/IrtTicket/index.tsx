import { useContext, useEffect, useState } from "react";
import axiosInstance from "src/axios/axiosInstance";
import routes from "src/components/Helpers/Routes";
import { CustomToastContext } from "src/StateProvider/CustomToastContext/CustomToastContext";

const IrtTicket = ({ openAuthId, openAuthData }) => {

  const toastConfig = useContext(CustomToastContext);
  const [irtTicketData, setIrtTicketData] = useState(null);

  useEffect(() => {
    fetchData();
  }, [openAuthId]);


  const fetchData = () => {
    axiosInstance()
      .get(`${routes.irtTicket.path}/approver/public/${openAuthId}`)
      .then(({ data: { data } }) => {
        setIrtTicketData(data?.irtTicket)
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }

  const submit = (status) => {
    axiosInstance().post(`${routes.irtTicket.path}/approver/public/response/${irtTicketData?._id}`, { user: openAuthData?.user, status: status })
      .then(({ data }) => {
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  }


  return (
    <>

    </>
  );
};

export default IrtTicket;

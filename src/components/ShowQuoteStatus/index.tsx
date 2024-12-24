import React from 'react';
import { QUOTATION_STATUS, sidebarResource } from 'src/constants/helpers';
import { BsFillClockFill, BsFillCheckCircleFill, BsFillXCircleFill } from 'react-icons/bs';
import styles from './quoteStatus.module.scss';
import routes from '../Helpers/Routes';
import { useMediaQuery } from '@mui/material';
import HtmlTooltip from '../CustomTooltipTitle';

const getStatusWithIcon = (status: any) => {
  let data = {
    icon: null,
    message: '',
    style: null
  };
  switch (status) {
    case QUOTATION_STATUS.sentToCustomer:
      data.icon = <BsFillClockFill size={20} />;
      data.message = `${sidebarResource?.quotation} has been sent to customer`;
      data.style = styles.sendQuote;
      break;
    case QUOTATION_STATUS.acceptByCustomer:
      data.icon = <BsFillCheckCircleFill size={20} />;
      data.message = `${sidebarResource?.quotation} has been accepted by customer`;
      data.style = styles.acceptedQuote;
      break;
    case QUOTATION_STATUS.rejectByCustomer:
      data.icon = <BsFillXCircleFill size={20} />;
      data.message = `${sidebarResource?.quotation} has been rejected by customer`;
      data.style = styles.rejectedQuote;
      break;
    default:
      data = null;
      break;
  }
  return data;
};

const ShowQuoteStatus = ({ status }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const data = getStatusWithIcon(status);

  if (!data) return null;

  if (isMobile) {
    return (
      <HtmlTooltip title={data.message} enterTouchDelay={0} arrow placement="top">
        <span className={`${data.style} cursor-pointer `}>{data.icon}</span>
      </HtmlTooltip>
    );
  }

  return (
    <div className={`${styles.mainContainer}`}>
      <div className={`${styles.quote} ${data.style}`}>
        {data.icon}
        <span>{data.message}</span>
      </div>
    </div>
  );
};

export default ShowQuoteStatus;

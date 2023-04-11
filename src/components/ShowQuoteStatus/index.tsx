import React from 'react';
import { QUOTATION_STATUS } from 'src/constants/helpers';
import { BsFillClockFill, BsFillCheckCircleFill, BsFillXCircleFill } from 'react-icons/bs';
import styles from './quoteStatus.module.scss';

interface quoteStatusInterface extends React.HTMLAttributes<HTMLDivElement> {
  isSentToCustomer: boolean;
  status: string;
}

const ShowQuoteStatus: React.FC<quoteStatusInterface> = ({ isSentToCustomer, status, className, ...others }) => {
  return isSentToCustomer || status === QUOTATION_STATUS.acceptByCustomer || status === QUOTATION_STATUS.rejectByCustomer ? (
    <div {...others} className={`${className} ${styles.mainContainer}`}>
      {isSentToCustomer ? (
        <div className={`${styles.quote} ${styles.sendQuote}`}>
          <BsFillClockFill size={20} />
          <span>Quote has been sent to customer</span>
        </div>
      ) : status === QUOTATION_STATUS.acceptByCustomer ? (
        <div className={`${styles.quote} ${styles.acceptedQuote}`}>
          <BsFillCheckCircleFill size={20} />
          <span>Quote has been accepted by customer</span>
        </div>
      ) : status === QUOTATION_STATUS.rejectByCustomer ? (
        <div className={`${styles.quote} ${styles.rejectedQuote}`}>
          <BsFillXCircleFill size={20} />
          <span>Quote has been rejected by customer</span>
        </div>
      ) : null}
    </div>
  ) : null;
};

export default ShowQuoteStatus;

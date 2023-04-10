import React from 'react';
import { QUOTATION_STATUS } from 'src/constants/helpers';
import { BsFillClockFill, BsFillCheckCircleFill, BsFillXCircleFill } from 'react-icons/bs';
import styles from './showDoa.module.scss';
import routes from '../Helpers/Routes';
import { Link } from 'react-router-dom';

interface doaDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  doaData: DOAData[];
}
export interface DOAData {
  users?: User[];
  status?: string;
}
export interface User {
  firstName?: string;
  lastName?: string;
  id?: string;
  status?: string;
}

const ShowDoaData: React.FC<doaDataInterface> = ({ status, doaData, className, ...others }) => {
  return (
    <div {...others} className={`${className} ${styles.mainContainer}`}>
      {status.includes(QUOTATION_STATUS.sentforDOA) && (
        <div className={`${styles.doa} ${styles.sendDoa}`}>
          <BsFillClockFill size={20} />
          <span>DOA Sent</span>
        </div>
      )}
      {status.includes(QUOTATION_STATUS.acceptedbyDOA) && (
        <div className={`${styles.doa} ${styles.acceptedDoa}`}>
          <BsFillCheckCircleFill size={20} />
          <span>Approved by DOA</span>
        </div>
      )}
      {status.includes(QUOTATION_STATUS.rejectedbyDOA) && (
        <div className={`${styles.doa} ${styles.rejectedDoa}`}>
          <BsFillXCircleFill size={20} />
          <span>Rejected by DOA</span>
        </div>
      )}
      {doaData &&
        doaData?.map((label, index) => (
          <>
            <div key={index} className={styles.doaUserContainer}>
              {label?.status === 'approve' && <BsFillCheckCircleFill size={18} style={{ color: '#4BAE4F' }} />}
              {label?.status === 'pending' && <BsFillClockFill size={18} style={{ color: '#F25F54' }} />}
              {label?.status !== 'pending' && label?.status !== 'approve' && <BsFillXCircleFill size={18} style={{ color: '#D73D24' }} />}

              <div className={styles.doaUserName}>
                {label?.status === 'pending' ? (
                  <>
                    {label?.users?.slice(0, 3).map((obj) => (
                      <div style={{ color: '#09445A' }}>
                        <Link title={obj?.firstName} className="link" to={`${routes.userDetail.path}/${obj?.id}`}>
                          {`${obj?.firstName} ${obj?.lastName}`}
                        </Link>
                      </div>
                    ))}
                    {label?.users?.length > 4 && `+ ${label?.users.length - 4} more`}
                  </>
                ) : (
                  <div style={{ color: '#09445A' }}>
                    <Link
                      title={label?.users.find((d) => d?.status === label?.status)?.firstName}
                      className="link"
                      to={`${routes.userDetail.path}/${label?.users.find((d) => d?.status === label?.status)?.id}`}
                    >
                      {`${label?.users.find((d) => d?.status === label?.status)?.firstName} ${
                        label?.users.find((d) => d.status === label?.status)?.lastName
                      }`}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        ))}
    </div>
  );
};

export default ShowDoaData;

import { makeStyles } from '@mui/styles';
import { BsFillCheckCircleFill, BsFillClockFill, BsFillXCircleFill } from 'react-icons/bs';
import routes from 'src/components/Helpers/Routes';
import { DOA_STATUS } from 'src/constants/helpers';
import { Link } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: 'flex',
    alignItems: 'center',
    background: '#ffffff',
    boxShadow: '0px 2.83064px 30px rgba(0, 0, 0, 0.06)',
    borderRadius: '0px 0px 2.83064px 2.83064px',
    maxWidth: 'max-content',
    padding: '5px 10px',
    flexWrap: 'wrap',
    marginBottom: '15px'
  },
  doa: {
    fontWeight: 600,
    marginRight: 15,
    fontSize: 14,
    '& span': {
      marginLeft: 3,
      verticalAlign: 'middle'
    },
    '& svg': {
      verticalAlign: 'middle'
    }
  },
  sendDoa: {
    color: '#0f9fa9'
  },
  acceptedDoa: {
    color: '#6ca826'
  },
  rejectedDoa: {
    color: '#d60f0f'
  },
  doaUserContainer: {
    '--gap': '7px',
    position: 'relative',
    display: 'flex',
    marginLeft: 'var(--gap, 5px)',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 400,
    color: '#3e3e3e',
    paddingRight: 'var(--gap, 5px)',
    '& svg': {
      display: 'block'
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      height: '100%',
      width: '1px',
      backgroundColor: '#737373',
      right: 0
    },
    '&:last-of-type': {
      '&::after': {
        content: 'unset'
      }
    }
  }
}));

const ShowDoa = ({ status, data }) => {
  const classes = useStyles();
  return (
    <>
      {data ? (
        <div className={classes.mainContainer}>
          {status === DOA_STATUS.sentForDoa && (
            <div className={`${classes.doa} ${classes.sendDoa}`}>
              <BsFillClockFill size={20} />
              <span>DOA Sent</span>
            </div>
          )}
          {status === DOA_STATUS.acceptedbyDOA && (
            <div className={`${classes.doa} ${classes.acceptedDoa}`}>
              <BsFillCheckCircleFill size={20} />
              <span>Approved by DOA</span>
            </div>
          )}
          {status === DOA_STATUS.rejectedbyDOA && (
            <div className={`${classes.doa} ${classes.rejectedDoa}`}>
              <BsFillXCircleFill size={20} />
              <span>Rejected by DOA</span>
            </div>
          )}
          {data?.doaUsers?.length &&
            data?.doaUsers?.map((users, index) => (
              <div key={index} className={classes.doaUserContainer}>
                {users?.status === DOA_STATUS.pending && <BsFillClockFill size={18} style={{ color: '#F25F54' }} />}
                <div>
                  {users?.users?.slice(0, 3).map((user) => (
                    <div style={{ color: '#09445A' }}>
                      <Link title={user?.name} className="link" to={`${routes.userDetail.path}/${user?._id}`} target="_blank">
                        {user?.name}
                      </Link>
                    </div>
                  ))}
                  {users?.users?.length > 4 && `+ ${users?.users?.length - 4} more`}
                </div>
              </div>
            ))}
        </div>
      ) : null}
    </>
  );
};

export default ShowDoa;

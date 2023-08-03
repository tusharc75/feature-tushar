import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Box, Paper, Tooltip } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import CopyToClipboard from '../components/Helpers/CopyToClipboard';
import { FcApproval } from 'react-icons/fc';
import routes from './Helpers/Routes';
import { Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { isMobile, isTablet } from 'react-device-detect';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 0
  },
  detailHeader: {
    borderBottom: '1px solid #e9e9e9',
    padding: '4px 11px',
    background: '#f5f5f5',
    borderRadius: '6px 6px 0 0'
  },
  box: {
    padding: theme.spacing(0.5, 1.5),
    borderRadius: '4px',
    boxShadow: '2px 2px 4px #747474',
    backgroundColor: 'var(--new_theme_color)',
    opacity: '0.95',
    border: '#03232e',
    // display: "flex",
    [theme.breakpoints.down('xs')]: {
      borderRadius: '4px',
      boxShadow: '2px 2px 4px #747474',
      background: 'white',
      border: '#03232e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 6px'
    }
  },
  lineAddStyle: {
    // width: "2px",
    // backgroundColor: "white",
    // paddingRight: "5px",
    // margin: "5px 7px",
    // borderRadius: "2px"
  },
  labelColor: {
    color: '#fff',
    [theme.breakpoints.down('xs')]: {
      color: '#010c02'
    }
  },
  skeleton: {
    marginRight: '10px'
  },
  qualified: {
    color: theme.palette.success.dark
  },
  unQulified: {
    color: theme.palette.error.dark
  }
}));

const DetailsPageHeader = (props) => {
  const { mainPoints, heading, children, showHeading, loading, isApproved, leadStatus } = props;

  const classes = useStyles();
  return (
    <>
      <div className={'mainHeader'}>
        {/* <Grid container justifyContent="space-between" className="detailHeader detail-header-purchase-order">
          <Grid item className="d-flex align-items-center">
            {loading ? (
              <Skeleton width={100} />
            ) : showHeading ? (
              <div className={'mobileHeading'}>
                <Typography
                  className="text-capitalize"
                  style={{ display: 'inline-block' }}
                  variant="h6"
                  component="h2"
                  color="primary"
                  id="detailHeaderPageTitle"
                >
                  <span className="d-flex align-items-center">
                    <span className="listingHeader"> {heading}</span>
                    {isApproved && (
                      <Tooltip title="Approved">
                        <FcApproval title="Approved" size={20} />
                      </Tooltip>
                    )}
                    {leadStatus ? (
                      <>
                        {leadStatus === 'Qualified' ? (
                          <FiCheckCircle title={leadStatus} className={classes.qualified} color="green" />
                        ) : leadStatus === 'Unqualified' ? (
                          <AiOutlineCloseCircle title={leadStatus} className={classes.unQulified} />
                        ) : (
                          ''
                        )}
                      </>
                    ) : null}
                  </span>
                </Typography>
              </div>
            ) : null}
          </Grid>
          <Grid
            id="detailHeaderPageActions"
            item
            className={
              isMobile && !isTablet ? 'd-flex align-items-center justify-flex-end gap-1' : 'd-flex align-items-center gap-2 justify-flex-end'
            }
          >
            {children}
          </Grid>
        </Grid> */}

        <Box className={`gap-2 ${mainPoints && 'detailHeaderDashboard'}`}>
          {loading ? (
            <Box display="flex" flexWrap="nowrap">
              {[...Array(4).keys()].map((i, index) => (
                <React.Fragment key={index}>
                  <Skeleton variant="rect" className={classes.skeleton} width={80} height={50} />
                  <Box marginY={1} />
                </React.Fragment>
              ))}
            </Box>
          ) : mainPoints && Object.keys(mainPoints).length ? (
            Object.keys(mainPoints).map((key, i) => {
              return (
                <React.Fragment key={i}>
                  {mainPoints[key] ? (
                    key === 'Parent Lead' ? (
                      <Box className={classes.box}>
                        <Typography
                          align="center"
                          variant="subtitle1"
                          style={{ opacity: 0.9, fontSize: '0.8rem' }}
                          className={`text-capitalize ${classes.labelColor}`}
                        >
                          {key}
                        </Typography>
                        <Link className="link" title={mainPoints[key].leadName} to={`${routes.leadDetail.path}/${mainPoints[key].leadId}`}>
                          {
                            <Typography align="center" className={classes.labelColor} style={{ fontWeight: 500 }}>
                              {mainPoints[key].leadName || ''}
                            </Typography>
                          }
                        </Link>
                      </Box>
                    ) : (
                      <Box className={classes.box}>
                        <div className={classes.lineAddStyle}> </div>
                        <div>
                          <Typography
                            align="left"
                            variant="subtitle1"
                            style={{ opacity: 0.9, fontSize: '0.8rem', lineHeight: '20px' }}
                            className={`text-capitalize ${classes.labelColor}`}
                          >
                            {key}
                          </Typography>
                          <Typography align="center" className={`text-truncate ${classes.labelColor}`} style={{ fontWeight: 500 }}>
                            {mainPoints[key] || ''}
                            {['email', 'phone'].indexOf(key.toLocaleLowerCase()) >= 0 ? (
                              <CopyToClipboard textToCopy={mainPoints[key]} style={{ color: isMobile || isTablet ? '#010c02' : 'white' }} />
                            ) : null}
                          </Typography>
                        </div>
                      </Box>
                    )
                  ) : null}
                </React.Fragment>
              );
            })
          ) : null}
        </Box>
      </div>
    </>
  );
};

DetailsPageHeader.propTypes = {
  total: PropTypes.any,
  active: PropTypes.any,
  inactive: PropTypes.any,
  heading: PropTypes.any,
  children: PropTypes.node,
  loading: PropTypes.any,
  logo: PropTypes.any,
  mainPoints: PropTypes.any,
  showHeading: PropTypes.any,
  isApproved: PropTypes.any,
  leadStatus: PropTypes.string
};

export default DetailsPageHeader;

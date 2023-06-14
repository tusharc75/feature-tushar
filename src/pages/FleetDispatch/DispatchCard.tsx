import React from 'react';
import { makeStyles, Typography, Box, Grid } from '@material-ui/core';
import { useDrag, useDrop } from 'react-dnd';
import LocalShippingIcon from '@material-ui/icons/LocalShipping';
import WorkIcon from '@material-ui/icons/Work';
import Gauges from '../../components/Gauges';

const useStyles = makeStyles((theme) => ({
  fleetBox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '4px',
    border: '1px solid var(--common-border-color)',
    padding: '15px',
    transition: 'transform .2s, background .3s',
    flexWrap: 'wrap',
    backgroundColor: 'var(--dark-secondary, #F8FFFC)',
    '&:hover': {
      transform: 'scale(1.01)',
      zIndex: '1'
    }
  },

  jobBox: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '4px',
    border: '1px solid var(--common-border-color)',
    padding: '15px',
    transition: 'transform .2s, background .3s',
    backgroundColor: 'var(--dark-secondary, #FFFAEF)',
    '&:hover': {
      transform: 'scale(1.01)',
      zIndex: '1'
    }
  },
  icon: {
    fontSize: '20px',
    display: 'inline-block !important',
    verticalAlign: 'bottom',
    marginRight: '10px'
  },
  truckIcon: {
    transform: 'rotateY(180deg)'
  },
  primaryText: {
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '1.28',
    color: 'var(--dark-primary-text, #2A3042)',
    marginBottom: '14px'
  },
  secondaryText: {
    fontWeight: 400,
    fontSize: '13px',
    lineHeight: 1.5,
    color: 'var(--dark-secondary-text, #5B5B5B)',

    '& strong': {
      fontWeight: 600,
      color: 'var(--dark-primary-text, #2A3042)'
    },
    marginBottom: '4px',
    '&:last-of-type': {
      marginBottom: 0
    }
  },
  contentContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    [theme.breakpoints.down('md')]: {
      marginBottom: '20px'
    }
  },
  gaugeContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    margin: '-10px -10px 0 0',
    justifyContent: 'center'
  },
  singleGauge: {
    maxWidth: '150px',
    flexBasis: '150px',
    padding: '10px 10px 0 0',

    [theme.breakpoints.up('md')]: {
      flexBasis: '50%',
      maxWidth: '50%'
    },
    [theme.breakpoints.up('lg')]: {
      flexBasis: '33.333%',
      maxWidth: '33.333%'
    }
  }
}));

const FleetDispatchBox = ({ data, id, index, moveCard, cardType, handleDispatch }) => {
  const classes = useStyles();
  const ref = React.useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'move',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId()
      };
    },
    hover: (item: any, monitor) => {
      if (!ref.current) {
        return;
      }
      if (item.type !== cardType) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop: (item: any) => {
      if (item?.cardType === cardType) {
        return;
      }
      if (cardType === 'fleet') {
        handleDispatch(data, item?.data);
      } else {
        handleDispatch(item?.data, data);
      }
    }
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'move',
    item: () => {
      return { id, index, cardType, data };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));

  const colors = ['#39EA75', '#2AC656', '#FFD92E', '#FCBE00', '#F95353', '#FF3636'];
  return (
    <div ref={ref} key={index}>
      {cardType === 'fleet' ? (
        <Box className={classes.fleetBox} style={{ opacity }}>
          <Grid container>
            <Grid item xs={12} md={6} lg={7}>
              <Box className={classes.contentContainer}>
                <Box sx={{ flexBasis: '20px' }}>
                  <LocalShippingIcon className={`${classes.truckIcon} ${classes.icon}`} />
                </Box>
                <Box sx={{ flexBasis: 'calc(100% - 35px)' }}>
                  <Typography className={classes.primaryText}>Fleet : {data?.fleetNumber}</Typography>
                  <Typography className={classes.secondaryText}>
                    <strong>Location :</strong> {data?.currentLocation?.optionLabel}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} lg={5}>
              <Box className={classes.gaugeContainer}>
                <Gauges className={classes.singleGauge} max={200} value={data?.temperature} lebel="TEMP" suffix={<> °F</>} />
                <Gauges className={classes.singleGauge} max={1000} value={data?.pressure} lebel="PRESSURE" suffix={<> PSI</>} />
                <Gauges className={classes.singleGauge} max={1000} value={data?.volume} lebel="VOLUME" suffix={<> MMcf</>} />
              </Box>
            </Grid>
          </Grid>
        </Box>
      ) : (
        <Box className={classes.jobBox} style={{ opacity }}>
          <Box mr="10px" className={classes.contentContainer}>
            <Box>
              <WorkIcon className={classes.icon} />
            </Box>
            <Box>
              <Typography className={classes.primaryText}>{data?.jobNumber}</Typography>
              <Typography className={classes.primaryText}>
                <strong>PRS :</strong> {data?.asset?.assetNumber}
              </Typography>
              <Typography className={classes.secondaryText}>
                <strong>Customer :</strong> {data?.customerContact?.optionLabel}
              </Typography>
              <Typography className={classes.secondaryText}>
                <strong>Location :</strong> {data?.shippingAddress?.optionLabel}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </div>
  );
};

export default FleetDispatchBox;

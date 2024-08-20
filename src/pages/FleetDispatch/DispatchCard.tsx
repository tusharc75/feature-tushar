import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Typography, makeStyles } from '@material-ui/core';
import WorkIcon from '@material-ui/icons/Work';

import MetricsWithIcon from 'src/components/MetricsWithIcon';
import { cn } from 'src/constants/helpers';

const useStyles = makeStyles((theme) => ({
  fleetBox: {
    cursor: 'pointer',
    position: 'relative',
    margin: '0px 6px 14px',
    borderRadius: '12px',
    border: '1px solid var(--common-border-color)',

    transition: 'transform .2s, background .3s',
    boxShadow: '0px 3px 30px rgba(0, 0, 0, 0.08)',
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
    marginBottom: '6px'
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
    flexWrap: 'wrap'
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

const FleetDispatchBox = ({ data, id, index, cardType }) => {
  const classes = useStyles();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging, active, over } = useSortable({
    id,
    data: {
      type: cardType,
      index,
      props: { data, id, index, cardType }
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition
  };

  const activeProps = active?.data?.current?.props;
  const overProps = over?.data?.current?.props;

  const activeType = activeProps?.cardType;
  const overType = overProps?.cardType;
  const shouldChangeBg = Boolean(overProps?.id === id && activeType !== overType);

  return (
    <li className={cn(`list-none`)} key={id} style={style} ref={setNodeRef} {...attributes} {...listeners}>
      {cardType === 'fleet' ? (
        <Box
          className={`${classes.fleetBox} p-[15px]  min-[1201px]:p-[18px_14px_24px_18px] ${
            shouldChangeBg ? 'bg-[var(--dark-primary,theme("colors.blue.200"))]' : 'bg-[var(--dark-secondary,white)]'
          }`}
        >
          <div>
            <div className="mb-[14px] md:mb-[24px]">
              <Typography className={classes.primaryText}>Fleet : {data?.fleetNumber}</Typography>
              <Typography className={classes.secondaryText}>
                <strong>Location :</strong> {data?.currentLocation?.optionLabel}
              </Typography>
            </div>
            <Box className={`${classes.gaugeContainer} gap-4`}>
              <MetricsWithIcon type="temperature" suffixText={<> °F</>} value={data?.temperature || 30} />
              <MetricsWithIcon type="pressure" suffixText={<> PSI</>} value={data?.pressure || 30} />
              <MetricsWithIcon type="volume" suffixText={<> MMcf</>} value={data?.volume || 30} />
            </Box>
          </div>
        </Box>
      ) : (
        <Box className={`${classes.jobBox}  ${shouldChangeBg ? '!bg-[var(--dark-primary,theme("colors.blue.200"))]' : ''}`}>
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
    </li>
  );
};

export default FleetDispatchBox;

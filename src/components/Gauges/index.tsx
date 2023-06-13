import React from 'react';
import GaugeChart from 'react-gauge-chart';
import { Box, Typography, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  lebel: {
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '12px',
    lineHeight: 1.84,
    color: 'var(--dark-secondary-text, #2A3042)'
  },
  gauge: {
    borderRadius: '50vmax 50vmax 0 0',
    '& svg': {
      maxWidth: '100%',
      width: '100%'
    }
  },
  svgContainer: {
    position: 'relative'
  },
  value: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 700,
    fontSize: '12px',
    lineHeight: '17px',
    color: 'var(--dark-primary-text, #000000)'
  }
}));

const getSegmentWidth = (segmentCount) => {
  const segmentArray = [];
  const singleSegement = 100 / segmentCount;
  for (let i = 0; i < segmentCount; i++) {
    segmentArray.push(singleSegement);
  }
  return segmentArray;
};

const getPercentage = ({ input, min, max }: { input: number; min: number; max: number }) => {
  const result = (input - min) / (max - min);
  return result;
};

const Gauges = ({
  lebel = 'PRESSURE',
  min = 0,
  max = 100,
  value = 30,
  suffix = <></>,
  prefix = <></>,
  colors = ['#39EA75', '#2AC656', '#FFD92E', '#FCBE00', '#F95353', '#FF3636'],
  textColor = 'var(--dark-secondary, #000000)',
  needleColor = 'var(--dark-primary-text, #1D1D1D)',
  needleBaseColor = 'var(--dark-primary-text, #1D1D1D)',
  cornerRadius = 1,
  segments = 6,
  segmentGap = 0,
  arcWidth = 0.2,
  marginInPercent = 0,

  style = {},
  className = '',
  ...chartProps
}) => {
  const classes = useStyles();
  return (
    <Box style={{ ...style }} className={className}>
      <Box className={classes.svgContainer}>
        <Typography className={classes.value}>
          {prefix}
          {value}
          {suffix}
        </Typography>
        <GaugeChart
          className={classes.gauge}
          style={{ background: 'var(--dark-secondary, #E6F8FC)' }}
          nrOfLevels={6}
          arcsLength={getSegmentWidth(segments)}
          colors={colors}
          percent={getPercentage({ min: min, max: max, input: value })}
          arcPadding={segmentGap}
          textColor={textColor}
          needleColor={needleColor}
          cornerRadius={cornerRadius}
          formatTextValue={(value) => `${value}`}
          arcWidth={arcWidth}
          marginInPercent={marginInPercent}
          hideText={true}
          {...chartProps}
        />
      </Box>
      <Typography className={classes.lebel}>{lebel}</Typography>
    </Box>
  );
};

export default Gauges;

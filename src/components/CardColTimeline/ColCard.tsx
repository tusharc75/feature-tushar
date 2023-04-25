import React from 'react';
import { colDataInterface } from './RenderColumns';
import { Box, Typography } from '@material-ui/core';
import styles from './index.module.scss';
import { WORKORDER_SERVICE_STEP_STATUS, dateTimeFormat, dateFormat } from 'src/constants/helpers';
import moment from 'moment';
import HtmlTooltip from '../CustomTooltipTitle';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import TimerComponent, { getFieldsWithOtherDetails } from './TimerComponent';

const ColCard: React.FC<colDataInterface> = ({ data, cardOnClick, cardDataRows, passFailStatus, passFailAccessor, cardTitleAccessor }) => {
  return (
    <Box
      className={styles.singleCard}
      style={{ cursor: cardOnClick ? 'pointer' : 'default' }}
      onClick={(e) => {
        if (cardOnClick) {
          cardOnClick(e, data);
        }
      }}
    >
      <Typography component={'h5'} className={styles.cardTitle}>
        {data[cardTitleAccessor]}
      </Typography>
      {cardDataRows.map((item) => {
        if (item.type === 'text') {
          return (
            <Typography className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] || '--'}
            </Typography>
          );
        }
        if (item.type === 'date') {
          return (
            <Typography className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'dateTime') {
          return (
            <Typography className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateTimeFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'timer') {
          const stepTimes = getFieldsWithOtherDetails(data[item.accessor] || []);
          if (stepTimes.length > 0)
            return (
              <Typography className={styles.cardDetails}>
                <span>{item.title}: </span>
                <TimerComponent stepTimes={stepTimes} />
              </Typography>
            );
        }
      })}
      {passFailStatus ? (
        <Box className={styles.passFail}>
          <RenderStatusIcon stepStatus={data[passFailAccessor]} />
        </Box>
      ) : null}
    </Box>
  );
};

export default ColCard;

const RenderStatusIcon = ({ stepStatus }: { stepStatus: string }) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip title={stepStatus}>
          <Box style={{ color: '#4BAE4F', fontSize: '25px', width: 25 }}>
            <AiFillCheckCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip title={stepStatus}>
          <Box style={{ color: '#F25F54', fontSize: '25px', width: 25 }}>
            <AiFillExclamationCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
    </>
  );
};

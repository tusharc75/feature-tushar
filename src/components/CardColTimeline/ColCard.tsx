import React from 'react';
import { colDataInterface } from './RenderColumns';
import { Box, Typography } from '@material-ui/core';
import styles from './index.module.scss';
import { WORKORDER_SERVICE_STEP_STATUS, dateTimeFormat, dateFormat } from 'src/constants/helpers';
import moment from 'moment';
import HtmlTooltip from '../CustomTooltipTitle';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import TimerComponent, { getFieldsWithOtherDetails } from './TimerComponent';
import { Link } from 'react-router-dom';

const ColCard: React.FC<colDataInterface> = ({ data, cardOnClick, cardDataRows, passFailStatus, passFailAccessor }) => {
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
      {cardDataRows.map((item, index) => {
        if (item.type === 'title') {
          if (item.renderer)
            return (
              <div style={{ borderStyle: 'solid' }} className="pb-[12px] mb-[12px] border-b border-[var(--common-border-color)]">
                {item.renderer(data)}
              </div>
            );
          return (
            <Typography key={index} component={'h5'} className={styles.cardTitle} title={data[item.accessor] || '--'}>
              {data[item.accessor] || '--'}
            </Typography>
          );
        }
        if (item.renderer) {
          return item.renderer(data);
        }
        if (item.type === 'linkTitle') {
          return (
            <Typography key={index} component={'h5'} className={styles.cardTitle} title={data[item.accessor] || '--'}>
              <Link target="_blank" className={styles.cardDetailsLink} to={() => item.link(data)}>
                {data[item.accessor] || '--'}
              </Link>
            </Typography>
          );
        }
        if (item.type === 'text') {
          return (
            <Typography key={index} className={styles.cardDetails} title={data[item.accessor] || '--'}>
              <span>{item.title}: </span>
              {data[item.accessor] || '--'}
            </Typography>
          );
        }
        if (item.type === 'link') {
          return (
            <Typography key={index} className={styles.cardDetails}>
              <span>{item.title}: </span>
              <Link className={styles.cardDetailsLink} to={() => item.link(data)} title={data[item.accessor] || '--'}>
                {data[item.accessor] || '--'}
              </Link>
            </Typography>
          );
        }
        if (item.type === 'date') {
          return (
            <Typography key={index} className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'dateTime') {
          return (
            <Typography key={index} className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateTimeFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'timer') {
          const stepTimes = getFieldsWithOtherDetails(data[item.accessor] || []);
          if (stepTimes.length > 0)
            return (
              <Typography key={index} className={styles.cardDetails}>
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

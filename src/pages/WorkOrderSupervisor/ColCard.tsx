import React from 'react';
import { singleColData } from './RenderColumns';
import { Box, Chip, Paper, Typography } from '@material-ui/core';
import styles from './index.module.scss';
import moment from 'moment';
import { WORKORDER_SERVICE_STEP_STATUS, dateTimeFormat } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';

interface singleColCardInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: singleColData;
}

const ColCard: React.FC<singleColCardInterface> = ({ data }) => {
  return (
    <Box className={styles.singleCard}>
      <Typography component={'h5'} className={styles.cardTitle}>
        {data.workOrder}
      </Typography>
      <Typography className={styles.cardDetails}>
        <span>Service Name: </span>
        {data.serviceName || '--'}
      </Typography>
      <Typography className={styles.cardDetails}>
        <span>Type: </span>
        {data.type || '--'}
      </Typography>
      <Typography className={styles.cardDetails}>
        <span>Technician: </span>
        {data.assignedUser || '--'}
      </Typography>
      <Typography className={styles.cardDetails}>
        <span>Status: </span>
        <Chip label={data.status || '--'} className={styles.chip} />
      </Typography>
      <Typography className={styles.cardDetails}>
        <span>Created at: </span>
        {moment(data.createDate).format(dateTimeFormat)}
      </Typography>
      <Box className={styles.passFail}>
        <RenderStatusIcon stepStatus={data.serviceStatus} />
      </Box>
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

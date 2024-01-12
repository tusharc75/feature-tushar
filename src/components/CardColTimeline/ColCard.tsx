import { Box, IconButton, Menu, MenuItem, Typography } from '@material-ui/core';
import moment from 'moment';
import React, { useState } from 'react';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import { Link } from 'react-router-dom';
import { WORKORDER_SERVICE_STEP_STATUS, dateFormat, dateTimeFormat } from 'src/constants/helpers';
import { datarowInterface } from '.';
import HtmlTooltip from '../CustomTooltipTitle';
import TimerComponent, { getFieldsWithOtherDetails } from './TimerComponent';
import styles from './index.module.scss';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
type IColCard = {
  data: any[];
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  passFailStatus?: boolean;
  passFailAccessor?: string;
  assignOpen?: boolean;
  assignOptions?: any;
  OpenTechnicianHandler?: (e: React.MouseEvent, data: any) => void | null;
  rowDef: datarowInterface[];
};

const ColCard: React.FC<IColCard> = ({
  data,
  cardOnClick,
  rowDef,
  passFailStatus,
  passFailAccessor,
  assignOpen = false,
  assignOptions,
  OpenTechnicianHandler
}) => {
  const tooltip = rowDef.find((item) => item.type === 'tooltip');
  let paddingRight = 0;
  if (passFailStatus) paddingRight += 29;
  if (Boolean(tooltip)) paddingRight += 29;

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
      {rowDef.map((item, index) => {
        if (item.type === 'tooltip') return null;
        if (item.type === 'title') {
          if (item.renderer)
            return (
              <div style={{ borderStyle: 'solid' }} className="pb-[12px] mb-[12px] border-b border-[var(--common-border-color)]">
                {item.renderer(data)}
              </div>
            );
          return (
            <div className={`${styles.cardTitle}`}>
              <h5 key={index} className={` line-clamp-1  `} style={{ paddingRight }} title={data[item.accessor] || '--'}>
                {data[item.accessor] || '--'}
              </h5>
            </div>
          );
        }
        if (item.renderer) {
          return item.renderer(data);
        }
        if (item.type === 'linkTitle') {
          if (!data[item.accessor]) return null;
          return (
            <Typography key={index} component={'h5'} className={styles.cardTitle} title={data[item.accessor] || '--'}>
              <Link target="_blank" className={styles.cardDetailsLink} to={() => item.link(data)}>
                {data[item.accessor] || '--'}
              </Link>
            </Typography>
          );
        }
        if (item.type === 'text') {
          if (!data[item.accessor]) return null;
          return (
            <Typography key={index} className={styles.cardDetails} title={data[item.accessor] || '--'}>
              <span>{item.title}: </span>
              {data[item.accessor] || '--'}
            </Typography>
          );
        }
        if (item.type === 'link') {
          if (!data[item.accessor]) return null;
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
          if (!data[item.accessor]) return null;
          return (
            <Typography key={index} className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'dateTime') {
          if (!data[item.accessor]) return null;
          return (
            <Typography key={index} className={styles.cardDetails}>
              <span>{item.title}: </span>
              {data[item.accessor] ? moment(data[item.accessor]).format(dateTimeFormat) : '--'}
            </Typography>
          );
        }
        if (item.type === 'timer') {
          const stepTimes = getFieldsWithOtherDetails(data[item.accessor] || []);
          if (!stepTimes.length) return null;
          if (stepTimes.length > 0)
            return (
              <Typography key={index} className={styles.cardDetails}>
                <span>{item.title}: </span>
                <TimerComponent stepTimes={stepTimes} />
              </Typography>
            );
        }
        return null;
      })}

      <Box className={`${styles.passFail} flex gap-2`}>
        {tooltip ? tooltip.renderer(data) : null}
        {passFailStatus ? <RenderStatusIcon stepStatus={data[passFailAccessor]} /> : null}
        {assignOpen ? <RenderAssignOptions openTechnicianHandler={OpenTechnicianHandler} assignOptions={assignOptions} data = {data} /> : null}
      </Box>
    </Box>
  );
};

export default ColCard;

const RenderStatusIcon = ({ stepStatus }: { stepStatus: string }) => {
  return (
    <>
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.passed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#4BAE4F', fontSize: '25px', width: 25 }}>
            <AiFillCheckCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
      {stepStatus === WORKORDER_SERVICE_STEP_STATUS.failed && (
        <HtmlTooltip title={stepStatus} placement="top" arrow enterTouchDelay={0}>
          <Box style={{ color: '#F25F54', fontSize: '25px', width: 25 }}>
            <AiFillExclamationCircle style={{ display: 'block' }} />
          </Box>
        </HtmlTooltip>
      )}
    </>
  );
};

const RenderAssignOptions = ({ openTechnicianHandler, assignOptions, data }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  return (
    <>
      <div>
        <IconButton
          size="small"
          color="primary"
          aria-label="menu"
          onClick={(event) => {
            handleOpenMenu(event);
          }}
        >
          <MoreHorizIcon />
        </IconButton>
      </div>
      {anchorEl && (
        <Menu id="simple-menu" anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
          {assignOptions.map((option) => {
              return (
                <MenuItem
                  key={option}
                  onClick={() => {
                    openTechnicianHandler(option,data);
                    setAnchorEl(null);
                  }}
                >
                  {option}
                </MenuItem>
              );
            })
          }
        </Menu>
      )}
    </>
  );
};

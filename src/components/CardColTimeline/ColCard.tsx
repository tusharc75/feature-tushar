import { Box, Checkbox, Typography } from '@mui/material';
import React, { useRef } from 'react';
import { AiFillCheckCircle, AiFillExclamationCircle } from 'react-icons/ai';
import { FaCheckCircle } from 'react-icons/fa';
import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { WORKORDER_SERVICE_STEP_STATUS, cn, displayDate } from 'src/constants/helpers';
import { datarowInterface } from '.';
import HtmlTooltip from '../CustomTooltipTitle';
import TimerComponent, { getFieldsWithOtherDetails } from './TimerComponent';
import styles from './index.module.scss';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

type IColCard = {
  data: any[];
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardOnSelect?: (data: any) => void | null;
  passFailStatus?: boolean;
  passFailAccessor?: string;
  rowDef: datarowInterface[];
  selectedRecords?: any[];
  background?: string;
  color?: string;
};

const ColCard: React.FC<IColCard> = ({
  data,
  cardOnClick,
  cardOnSelect,
  rowDef,
  passFailStatus,
  passFailAccessor,
  selectedRecords,
  background = '',
  color = ''
}) => {
  const tooltip = rowDef.find((item) => item.type === 'tooltip');
  const isSelected = selectedRecords?.map((r) => r?._id)?.includes(data['_id']);
  let paddingRight = 0;
  let paddingLeft = 0;
  if (passFailStatus) paddingRight += 29;
  if (Boolean(tooltip)) paddingRight += 29;
  if (Boolean(cardOnSelect)) paddingLeft += 24;

  const clickTimeout = useRef(null);

  const handleSelect = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    clearTimeout(clickTimeout.current);

    clickTimeout.current = setTimeout(() => {
      if (cardOnSelect) {
        cardOnSelect(data);
      }
    }, 250);
  };

  const handleClick = (e) => {
    clearTimeout(clickTimeout.current);
    if (cardOnClick) {
      cardOnClick(e, data);
    }
  };

  return (
    <Box className={cn(styles.singleCard, isSelected ? (background && color ? `${background} ${color}` : 'bg-[#d5d2f7] dark:bg-neutral-800') : '')}>
      <div onClick={handleClick} style={{ cursor: cardOnClick ? 'pointer' : 'default' }}>
        {cardOnSelect && (
          <span className="absolute left-[2px] top-[8px]">
            <Checkbox
              size="small"
              icon={<RadioButtonUnchecked />}
              checkedIcon={<CheckCircle />}
              checked={isSelected}
              onClick={(e) => handleSelect(e)}
            />
          </span>
        )}
        {rowDef.map((item, index) => {
          if (item.type === 'tooltip') return null;
          if (item.type === 'title') {
            if (item.renderer)
              return (
                <div style={{ borderStyle: 'solid' }} className="mb-[12px] border-b border-[var(--common-border-color)] pb-[12px]">
                  {item.renderer(data)}
                </div>
              );
            return (
              <div className={`${styles.cardTitle}`}>
                <h5 key={index} className={` line-clamp-1  `} style={{ paddingRight, paddingLeft }} title={data[item.accessor] || '--'}>
                  <span>{data[item.accessor] || '--'}</span>
                  {item?.link && (
                    <span style={{ marginLeft: '10px' }}>
                      <Link
                        className={`${styles.cardDetailsLink} min-w-0 `}
                        onClick={(e) => e.stopPropagation()}
                        target={item.target || '_blank'}
                        to={() => item.link(data)}
                        title={''}
                      >
                        <FiExternalLink size={16} />
                      </Link>
                    </span>
                  )}
                </h5>
              </div>
            );
          }
          if (item.renderer) {
            return (
              <Typography key={index} className={styles.cardDetails} title={data[item.accessor] || '--'}>
                {item.renderer(data)}
              </Typography>
            );
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
            let linkText = data[item.accessor] || '--';
            let outsideText = null;
            if (item.target === '_blank') {
              linkText = <FiExternalLink size={16} />;
              outsideText = data[item.accessor] || '--';
            }
            return (
              <Typography key={index} className={styles.cardDetails}>
                <span>{item.title}: </span>
                <span className="flex min-w-0 gap-1">
                  <span className="min-w-0 overflow-hidden text-ellipsis [font-weight:400_!important]">{outsideText}</span>
                  <Link
                    className={`${styles.cardDetailsLink} block min-w-0 flex-shrink-0`}
                    onClick={(e) => e.stopPropagation()}
                    target={item.target}
                    to={() => item.link(data)}
                    title={data[item.accessor] || '--'}
                  >
                    {linkText}
                  </Link>
                </span>
              </Typography>
            );
          }
          if (item.type === 'date') {
            if (!data[item.accessor]) return null;
            return (
              <Typography key={index} className={styles.cardDetails}>
                <span>{item.title}: </span>
                {data[item.accessor] ? displayDate(data[item.accessor]) : '--'}
              </Typography>
            );
          }
          if (item.type === 'dateTime') {
            if (!data[item.accessor]) return null;
            return (
              <Typography key={index} className={styles.cardDetails}>
                <span>{item.title}: </span>
                {data[item.accessor] ? displayDate(data[item.accessor]) : '--'}
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
      </div>

      <Box className={`${styles.passFail} flex items-center gap-2`}>
        {tooltip ? tooltip.renderer(data) : null}
        {passFailStatus ? <RenderStatusIcon stepStatus={data[passFailAccessor]} /> : null}
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

import { Avatar, Box, Collapse, IconButton, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Close, DateRange, ExpandLess, ExpandMore, Image, Map } from '@material-ui/icons';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { TreeItem, TreeView } from '@material-ui/lab';
import moment from 'moment';
import React, { Fragment, useCallback, useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { dateTimeFormat } from 'src/constants/helpers';
import MapView from '../Map';
import { getColorFromPriority, getPriority } from './helperFunctions';
import styles from './roadmap.module.scss';
import type { TActivity } from './types';

type TProps = {
  activity: TActivity[];
  expanded: any;
  selected: string | null;
  handleToggle: any;
  handleSelect: any;
  setSelected: (data) => void;
};

const useStyles = makeStyles((theme) => ({
  root: {
    '&:hover > $content': {
      backgroundColor: theme.palette.action.hover
    },
    '&:focus > $content, &$selected > $content': {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.grey[100]})`,
      color: 'var(--tree-view-color)'
    },
    '&:focus > $content $label, &:hover > $content $label, &$selected > $content $label': {
      backgroundColor: 'transparent'
    }
  },
  label: {
    paddingLeft: 0
  },
  group: {
    marginLeft: 0
  }
}));

const COLLAPSIBLE_UNIQUE_NAME = '_fieldTicketInvoice';

const MobileRoadmap: React.FC<TProps> = ({ activity, expanded, selected, handleToggle, handleSelect, setSelected }) => {
  const classes = useStyles();
  const [open, setOpen] = useState<string | false>(false);

  const getTreeNodes = (treeList: TActivity[]) => {
    return treeList.map((data, index) => {
      let children = [];
      if (data.child && data.child.length > 0) {
        children = getTreeNodes(data.child);
        children.push(<div></div>);
      }

      let label = (
        <Fragment key={data._id}>
          <div
            role="button"
            className="grid min-h-[70px] grid-cols-[1fr_auto] items-center gap-4 pr-4"
            onClick={(event) => {
              handleSelect(event, data, 'technician');
            }}
          >
            <div className="flex items-center">
              <Avatar variant="circle" sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
                <Image style={{ fontSize: 28 }} />
              </Avatar>
              <Box ml={2} flex style={{ flexDirection: 'column' }}>
                <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${data?.firstName} ${data?.lastName}`}</Typography>
                <p style={{ fontSize: '0.8rem', color: 'grey' }}>{`${data?.competencyType?.optionLabel || ''}`}</p>
                <p style={{ fontSize: '0.6rem', color: 'grey' }}>{`${data?.competencies?.map((e) => e.optionLabel)?.toString()}`}</p>
              </Box>
            </div>
            <div className="">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  handleMapClick(`${index}`);
                  handleSelect(event, data, 'map');
                }}
              >
                <Map fontSize="medium" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected(null);
                  handleChange(`${index}`);
                }}
              >
                {compareCollapse(index) ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </div>
          </div>
          <Collapse in={compareCollapse(index)}>
            <div className="-mb-[1px] -ml-[24px] -mr-[1px] border border-[var(--common-border-color)] bg-[var(--dark-secondary,white)] px-4 py-4">
              {!selected ? (
                <Box>
                  <CalendarData activity={data} />
                </Box>
              ) : (
                <Box width={'100%'} height={'100%'} className=" relative overflow-auto">
                  <MapView technician={selected} />
                  <IconButton
                    onClick={() => {
                      setSelected(null);
                    }}
                    size="small"
                    style={{
                      padding: '8.5px',
                      position: 'absolute',
                      top: 11,
                      right: 56,
                      zIndex: 1,
                      backgroundColor: 'var(--dark-secondary, white)'
                    }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              )}
            </div>
          </Collapse>
        </Fragment>
      );

      return (
        <TreeItem
          key={index}
          nodeId={data._id.toString()}
          label={label}
          children={children}
          style={{ borderBottom: '1px solid var(--common-border-color)' }}
          classes={{
            root: classes.root
          }}
        />
      );
    });
  };

  const handleChange = useCallback((index: string | number) => {
    const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
    setOpen((prev) => (!prev ? newIndex : prev === newIndex ? false : newIndex));
  }, []);

  const compareCollapse = useCallback(
    (index: number | string) => {
      const newIndex = `${index}${COLLAPSIBLE_UNIQUE_NAME}`;
      return open === newIndex;
    },
    [open]
  );

  const handleMapClick = useCallback(
    (index: number | string) => {
      const isOpen = compareCollapse(index);
      if (isOpen) return;
      handleChange(index);
    },
    [compareCollapse, handleChange]
  );

  let TreeNodes = getTreeNodes(activity);

  return (
    <div className="border border-[var(--common-border-color)]">
      <div className="flex items-center gap-2 p-4 " style={{ borderBottom: '1px solid var(--common-border-color)' }}>
        <Map />
        <Typography variant="body1" display="block">
          Technician
        </Typography>
      </div>
      <div className="tree">
        <TreeView
          defaultCollapseIcon={<ExpandMore />}
          defaultExpandIcon={<ChevronRightIcon />}
          expanded={expanded}
          selected={selected}
          onNodeToggle={handleToggle}
        >
          {TreeNodes.map((node) => {
            return node;
          })}
        </TreeView>
      </div>
    </div>
  );
};

export default MobileRoadmap;

type TCalendarProps = {
  activity: TActivity;
};
const CalendarData: React.FC<TCalendarProps> = ({ activity }) => {
  const services = activity.fieldTicket;
  // const name = activity.firstName + ' ' + activity.lastName;
  // const createDate = activity.createDate;
  if (!services || !services.length) return <p className=" text-center text-sm">No Data found</p>;
  return (
    <div className="roadmapContainer grid gap-5">
      {services.map((service, index) => {
        const priority = getPriority(service.status);
        const bgColor = getColorFromPriority(priority);
        return (
          <div key={service._id}>
            <span className="mb-[7px] flex items-center gap-2 text-[12px]">
              <DateRange className="max-h-[16px] max-w-[16px]" />
              <span className="text-[#6B6B6B] dark:text-gray-200">{moment(service.startDate).format(dateTimeFormat)}</span>
            </span>
            <HtmlTooltip title={<p>{service?.fieldTicket[0]?.fieldTicketNumber}</p>} placement="top">
              <div className={`flex min-h-[20px] flex-wrap rounded-md px-3 py-2 ${bgColor}`}>
                <h6 className={`${styles.servicesText} truncate text-sm`} title={service?.serviceDetail?.serviceName}>
                  {service?.serviceDetail?.serviceName}
                </h6>
                <span className={`${styles.chip} ${styles[priority]} ml-auto`}>
                  <Typography component={'span'}>{service.status}</Typography>
                </span>
              </div>
            </HtmlTooltip>
          </div>
        );
      })}
    </div>
  );
};

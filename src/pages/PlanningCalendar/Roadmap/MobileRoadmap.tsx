import React, { FC, Fragment, useCallback, useMemo, useState } from 'react';
import type { Activity } from './types';
import { useAppTheme } from 'src/constants/AppConfig';
import { Typography, Box, Avatar, IconButton, Collapse, Tooltip, Button } from '@material-ui/core';
import { Close, Map, ExpandMore, ExpandLess, DateRange } from '@material-ui/icons';
import moment from 'moment';
import { dateTimeFormat, dateFormat } from 'src/constants/helpers';

interface MobileRoadmapProps {
  activity: Activity[];
  expanded: any;
  selected: string | null;
  handleToggle: any;
  handleSelect: any;
  setSelected: (data) => void;
}

const MobileRoadmap: FC<MobileRoadmapProps> = ({ activity, expanded, selected, handleToggle, handleSelect, setSelected }) => {
  const [themeColor] = useAppTheme();
  const [open, setOpen] = useState<string | false>(false);

  const handleChange = useCallback((name: string) => {
    setOpen((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  const compareCollapse = useCallback(
    (name: string) => {
      return open === name;
    },
    [open]
  );

  const types = useMemo(
    () => [
      { _id: '1', name: 'Planned', color: themeColor === 'light' ? 'hsl(46, 95%, 92%)' : '#dda900' },
      { _id: '2', name: 'In-Use', color: themeColor === 'light' ? 'hsl(342, 100%, 97%)' : '#cd3865' },
      { _id: '3', name: 'Available', color: themeColor === 'light' ? 'hsl(206, 100%, 97%)' : '#176fb2' }
    ],
    [themeColor]
  );

  return (
    <div className="mt-4 border border-[var(--common-border-color)]">
      <div className="head sticky top-[112px]  px-3 py-2" style={{ borderBottom: '1px solid var(--common-border-color)' }}>
        <p className="text-[18px] font-semibold">Products</p>
      </div>
      <div className="max-h-[600px] overflow-auto">
        {activity.map((data, index) => {
          return (
            <section key={data._id} className="px-3 py-2" title={data.productName || data.name}>
              <div
                className="head-section flex cursor-pointer flex-wrap items-center justify-between truncate"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChange(`${index}_${data.productName || data.name}`);
                }}
              >
                <Typography variant="subtitle2" className="text-truncate max-w-[calc(100%-30px)]" title={data?.productName}>
                  {data.productName || data.name}
                </Typography>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChange(`${index}_${data.productName || data.name}`);
                  }}
                  size="small"
                >
                  {compareCollapse(`${index}_${data.productName || data.name}`) ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </div>
              <Collapse in={compareCollapse(`${index}_${data.productName || data.name}`)}>
                <RenderSubTree data={data.planning} subTrees={types} />
              </Collapse>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default MobileRoadmap;

type TSubTreeProps = {
  data: Activity['planning'];
  subTrees: {
    _id: string;
    name: string;
    color: string;
  }[];
};

const RenderSubTree: FC<TSubTreeProps> = ({ data, subTrees }) => {
  const [open, setOpen] = useState<string | false>(false);

  const handleChange = useCallback((name: string) => {
    setOpen((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  const compareCollapse = useCallback(
    (name: string) => {
      return open === name;
    },
    [open]
  );
  const dataMap = useMemo(
    () => ({
      available: 'Planned',
      inUse: 'In-Use',
      planned: 'Available'
    }),
    []
  );
  return (
    <>
      {subTrees.map((tree) => {
        return (
          <div className="mt-3 grid gap-2" key={tree._id}>
            <Button
              variant="contained"
              role="button"
              fullWidth
              tabIndex={'0'}
              className="no-shadow px-3 py-2"
              style={{ background: tree.color }}
              onClick={() => handleChange(tree.name)}
              endIcon={compareCollapse(tree.name) ? <ExpandLess /> : <ExpandMore />}
            >
              {tree.name}
            </Button>
            <Collapse in={compareCollapse(tree.name)}>
              <div className="grid gap-2 py-2">
                {data.map((item) => {
                  if (dataMap[item.type] !== tree.name) return null;
                  else {
                    return (
                      <div className="rounded-md border border-[var(--common-border-color)] bg-[white] p-2 dark:bg-[var(--dark-secondary)]">
                        <div className="mb-1 flex flex-wrap justify-between gap-2 text-[12px] text-gray-500 dark:text-gray-300">
                          {moment(item.startDate).format(dateFormat)} - {moment(item.endDate).format(dateFormat)}
                        </div>
                        <p>
                          <b className="font-semibold">QTY :</b> {item.qty}
                        </p>
                      </div>
                    );
                  }
                })}
                {data.filter((item) => dataMap[item.type] === tree.name).length === 0 && (
                  <div className="rounded-md bg-[white] p-3 text-center dark:bg-[var(--dark-secondary)]">No Data Found</div>
                )}
              </div>
            </Collapse>
          </div>
        );
      })}
    </>
  );
};

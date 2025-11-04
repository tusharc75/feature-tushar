import { KeyboardArrowRight } from '@mui/icons-material';
import { Collapse, Skeleton } from '@mui/material';
import React from 'react';
import AllColumns from 'src/components/CardColTimeline1/components/AllColumns';
import { CommonProps } from 'src/components/CardColTimeline1/components/types';
import { UseGroups } from 'src/components/CardColTimeline1/useGroups';
import RippleButton from 'src/components/RippleButton';
import { cn } from 'src/constants/helpers';

type RenderAllGroupProps<D, C extends readonly string[]> = Omit<
  CommonProps<D, C>,
  'column' | 'primaryField' | 'actionField' | 'defaultDisplay' | 'group'
> & {
  groupState: UseGroups;
};

const RenderAllGroup = <D, C extends readonly string[]>({ state, groupState, ...rest }: RenderAllGroupProps<D, C>) => {
  const { groups, isGroupDataFetching, expandedGroup, toggleExpand, groupSelectorValue } = groupState;

  return (
    <ul className="list-none space-y-2">
      {isGroupDataFetching ? (
        <>
          {[...Array(7).keys()].map((d) => (
            <li key={d} className="list-none">
              <RippleButton className="flex w-full items-center gap-2 rounded-md  bg-neutral-100 px-2  py-2 dark:bg-neutral-800">
                <span className={cn('transition-transform')}>
                  <Skeleton width={24} />
                </span>
                <Skeleton width={200} />
                <span>
                  <Skeleton width={41} />
                </span>
              </RippleButton>
            </li>
          ))}
        </>
      ) : (
        groups?.map((g) => {
          return (
            <li key={g.optionValue} className="list-none">
              <RippleButton
                onClick={() => toggleExpand(g)}
                className="flex w-full items-center gap-2 rounded-md  bg-neutral-100 px-2 py-2 dark:bg-neutral-800"
              >
                <span className={cn('transition-transform', expandedGroup === g.optionValue ? '[transform:rotate(90deg)]' : '')}>
                  <KeyboardArrowRight />
                </span>
                {g.optionLabel}{' '}
                <span>
                  ({g.count.completed}/{g.count.total})
                </span>
              </RippleButton>
              <Collapse in={expandedGroup === g.optionValue} unmountOnExit>
                <div className="py-4">
                  <AllColumns state={state} {...rest} group={g} />
                </div>
              </Collapse>
            </li>
          );
        })
      )}
    </ul>
  );
};

export default RenderAllGroup;

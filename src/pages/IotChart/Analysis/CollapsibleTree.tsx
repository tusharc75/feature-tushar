import React, { FC, useRef, useState } from 'react';
import { TCategories, TDataPoints } from './types';
import { Collapse } from '@material-ui/core';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import Chart from '../Helper/Chart';
import { VariableSizeList } from 'react-window';

const buttonClass = `appearance-none  focus:outline-[var(--new-theme-color)] focus-visible:outline-[var(--new-theme-color)] border-0 mx-[0.5px] mx-auto outline-transparent w-full flex gap-2 items-center px-2 py-2 cursor-pointer bg-[var(--accordion-summary-bg,_#fff)] text-[var(--primary-text)] rounded-sm text-md font-semibold`;
const cssVariables = `[--roundness:5px]`;

interface CollapsibleTreeProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: TCategories[];
  dateFilters: any;
  assetId: string;
}

const RenderChildCollapsible = ({
  index,
  style,
  data,
  open,
  handleClick,
  dateFilters,
  assetId
}: {
  index: number;
  style: React.CSSProperties;
  data: TDataPoints;
  open: string | boolean;
  handleClick: (id: string, index: number) => void;
  dateFilters: any;
  assetId: string;
}) => {
  const dataPoint = data[index];
  return (
    <div style={style}>
      <div key={dataPoint?._id} className={`border rounded-[var(--roundnes,_5px)]`}>
        <div className="" style={{ borderBottom: open === dataPoint._id ? '1px solid var(--common-border-color)' : 'none' }}>
          <button
            className={`no-shadow text-left ${buttonClass}`}
            onClick={() => {
              handleClick(dataPoint._id, index);
            }}
          >
            {open === dataPoint._id ? <ExpandLess /> : <ExpandMore />}
            <span>{dataPoint.fieldLabel}</span>
          </button>
        </div>
        <Collapse in={dataPoint._id === open} unmountOnExit>
          <div className="m-3 md:m-4">
            <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
              <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[dataPoint]} />
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
};

const RenderParentCollapsible = ({
  category,
  open,
  handleClick,
  dateFilters,
  assetId
}: {
  category: TCategories;
  open: string | boolean;
  handleClick: (id: string) => void;
  dateFilters: any;
  assetId: string;
}) => {
  const listRef = useRef(null);
  const prevIndex = useRef(0);
  const [childOpen, setChildOpen] = useState<string | boolean>(false);

  const handleChildClick = (id: string, index = 1) => {
    setChildOpen((prev) => {
      return prev === id ? false : id;
    });

    let relativeIndex = prevIndex.current > index ? index : prevIndex.current;
    if (listRef.current) {
      listRef.current.resetAfterIndex(relativeIndex, true);
    }
    prevIndex.current = index;
  };

  return (
    <div key={category.name} className={`border rounded-[var(--roundnes,_5px)]`}>
      <div className="" style={{ borderBottom: open === category._id ? '1px solid var(--common-border-color)' : 'none' }}>
        <button className={`no-shadow text-left ${buttonClass}`} onClick={() => handleClick(category._id)}>
          {open === category._id ? <ExpandLess /> : <ExpandMore />}
          <span>{category.name}</span>
        </button>
      </div>
      <Collapse in={category._id === open} unmountOnExit>
        <div className="m-3 md:m-4">
          {category?.child?.length > 0 ? (
            category.child.map((child) => (
              <RenderParentCollapsible
                key={child._id}
                category={child}
                open={open}
                handleClick={handleClick}
                dateFilters={dateFilters}
                assetId={assetId}
              />
            ))
          ) : (
            <VariableSizeList
              ref={listRef}
              className="List"
              height={800}
              itemCount={category.dataPoints?.length}
              itemSize={(index) => {
                return category.dataPoints[index]._id === childOpen ? 600 : 42;
              }}
              itemData={category.dataPoints}
              width={'100%'}
            >
              {(props) => (
                <RenderChildCollapsible {...props} open={childOpen} handleClick={handleChildClick} dateFilters={dateFilters} assetId={assetId} />
              )}
            </VariableSizeList>
          )}
        </div>
      </Collapse>
    </div>
  );
};

const CollapsibleTree: FC<CollapsibleTreeProps> = ({ categories, dateFilters, assetId, ...others }) => {
  const [open, setOpen] = useState<string | boolean>(false);

  const handleClick = (id: string) => {
    setOpen((prev) => (prev === id ? false : id));
  };

  return (
    <div {...others} className={`${cssVariables}`}>
      {categories.map((category) => {
        return (
          <div key={category._id}>
            <RenderParentCollapsible category={category} open={open} handleClick={handleClick} dateFilters={dateFilters} assetId={assetId} />
          </div>
        );
      })}
    </div>
  );
};

export default CollapsibleTree;

import React, { useEffect } from 'react';
import ColCard from './ColCard';
import { datarowInterface } from './index';
import { FixedSizeList as List } from 'react-window';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any;
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardHeight?: number;
  minHeight?: number;
  setMinHeight?: any;
  maxHeightFound?: number;
  setMaxHeightFound?: any;
  scrollAmmount?: number;
}

const RenderColumns = ({
  data,
  cardOnClick,
  cardDataRows,
  passFailStatus,
  passFailAccessor,
  cardHeight = 130,
  minHeight,
  setMinHeight,
  maxHeightFound,
  setMaxHeightFound,
  scrollAmmount
}: colDataInterface) => {
  const listRef = React.useRef(null);
  const listWrapperRef = React.useRef(null);

  function handleScroll(ammount) {
    listRef.current?.scrollTo(ammount);
  }

  useEffect(() => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        handleScroll(scrollAmmount);
      });
    }
    // if (listWrapperRef.current) {
    //   const element = listWrapperRef.current as HTMLDivElement;
    //   console.log('hi');
    //   element.scrollTo(0, 0);
    // }
  }, [scrollAmmount, listRef.current]);

  const Row = ({ index, style }) => {
    const colData = data[index];

    return (
      <div style={style}>
        <ColCard
          key={index}
          data={colData}
          cardOnClick={cardOnClick}
          cardDataRows={cardDataRows}
          passFailStatus={passFailStatus}
          passFailAccessor={passFailAccessor}
        />
      </div>
    );
  };

  useEffect(() => {
    if (listWrapperRef.current) {
      const element = listWrapperRef.current as HTMLDivElement;
      const height = element.children[0].children[0].clientHeight;
      if (maxHeightFound < height) {
        setMaxHeightFound(height);
        setMinHeight(height);
      }
    }
  }, [listWrapperRef.current]);

  return (
    <div ref={listWrapperRef}>
      <List
        ref={listRef}
        style={{ overflowX: 'hidden', scrollBehavior: 'smooth' }}
        height={600}
        itemCount={data.length}
        className={'hiddenScrollbar'}
        itemSize={cardHeight}
        width={'100%'}
      >
        {Row}
      </List>
    </div>
  );
};
export default RenderColumns;

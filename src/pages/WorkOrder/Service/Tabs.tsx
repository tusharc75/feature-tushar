import React, { useRef, useEffect, useState } from 'react';
import styles from './Tabs.module.scss';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';

let childrenCount = 0;

const getListWithWidth = (container) => {
  const elemList = container.querySelectorAll('.single-tab');
  let list = [];
  for (const element of elemList) {
    list.push(element.getAttribute('data-width'));
  }
  return list;
};

export const Tabs = ({ children }) => {
  const sliderRef = useRef(null);
  const sliderContentRef = useRef(null);
  const [scrollSettings, setScrollSettings] = useState({
    currentElement: 0,
    width: 0,
    element: null
  });

  useEffect(() => {
    if (sliderContentRef.current && sliderRef.current) {
      setScrollSettings({ ...scrollSettings, width: sliderContentRef.current.clientWidth, element: sliderRef.current });
    }
  }, [sliderContentRef, sliderRef]);

  const scrollNext = () => {
    const areaToScroll = (scrollSettings.currentElement + 1) * scrollSettings.width;

    scrollSettings.element.scroll({
      top: 0,
      left: areaToScroll,
      behavior: 'smooth'
    });
    setScrollSettings((prev) => ({
      ...prev,
      currentElement: prev.currentElement < childrenCount - 1 ? prev.currentElement + 1 : childrenCount - 1
    }));
  };

  const scrollPrev = () => {
    const areaToScroll = (scrollSettings.currentElement - 1) * scrollSettings.width;

    scrollSettings.element.scroll({
      top: 0,
      left: areaToScroll,
      behavior: 'smooth'
    });
    setScrollSettings((prev) => ({ ...prev, currentElement: prev.currentElement !== 0 ? prev.currentElement - 1 : 0 }));
  };

  const [prevButtonDisabled, setPrevButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  childrenCount = React.Children.toArray(children).length;

  return (
    <div className={styles.tabContainerPos}>
      <div className={styles.tabContainer}>
        <button title="previous" className={`${styles.button} ${styles.prevButton}`} onClick={scrollPrev} disabled={prevButtonDisabled}>
          <MdArrowBackIos />
        </button>
        <div className={styles.TabContents}>
          <div className={styles.tabs} ref={sliderRef}>
            <div className={styles.sliderContainer} ref={sliderContentRef}>
              {React.Children.map(children, (child) => {
                return React.cloneElement(child, {}, null);
              })}
            </div>
          </div>
        </div>
        <button title="next" className={`${styles.button} ${styles.nextButton}`} onClick={scrollNext} disabled={nextButtonDisabled}>
          <MdArrowForwardIos />
        </button>
      </div>
    </div>
  );
};

export const Tab = ({ content = <></> }) => {
  return <div className={`${styles.singleTab} single-tab`}>{content}</div>;
};

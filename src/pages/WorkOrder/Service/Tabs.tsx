import React, { useRef, useEffect, useState } from 'react';
import styles from './Tabs.module.scss';
import { MdArrowBackIos, MdArrowForwardIos } from 'react-icons/md';

const getListWithWidth = (container) => {
  const elemList = container.querySelectorAll('.single-tab');
  let list = [];
  for (const element of elemList) {
    list.push(element.getAttribute('data-width'));
  }
  return list;
};

const slideNext = (props) => {
  const { currentIndex, sliderContainer, setCurrentIndex, slidableContent, translated, setTranslated } = props;
  const elementsWidthList = getListWithWidth(slidableContent);
  const slidableContentTotalWidth = slidableContent?.offsetWidth;
  const sliderContainerWidth = sliderContainer?.offsetWidth;
  let totalTranslation = translated;
  let disabled = false;
  let areaToSlide = 0;

  setCurrentIndex((prev) => prev + 1);
  if (currentIndex >= elementsWidthList.length) {
    setCurrentIndex(elementsWidthList.length);
  }
  areaToSlide = parseInt(elementsWidthList[currentIndex]);
  if (areaToSlide === NaN) areaToSlide = 150;

  if (slidableContentTotalWidth + totalTranslation - sliderContainerWidth <= 0) {
    areaToSlide = 0;
    setTranslated((slidableContentTotalWidth - sliderContainerWidth) * -1);
    totalTranslation = (slidableContentTotalWidth - sliderContainerWidth) * -1;
    slidableContent.style.transform = `translateX(${totalTranslation}px)`;
    disabled = true;
  } else {
    setTranslated((prev) => {
      totalTranslation = prev - areaToSlide;
      slidableContent.style.transform = `translateX(${totalTranslation}px)`;
      return prev - areaToSlide;
    });
    disabled = false;
  }
  return disabled;
};

const slidePrev = (props) => {
  const { currentIndex, sliderContainer, setCurrentIndex, slidableContent, translated, setTranslated } = props;
  const elementsWidthList = getListWithWidth(slidableContent);
  const slidableContentTotalWidth = slidableContent?.offsetWidth;
  const sliderContainerWidth = sliderContainer?.offsetWidth;
  let totalTranslation = translated;
  let disabled = false;

  let areaToSlide = 0;

  // for (let i = currentIndex; i >= 0; i--) {
  //   if (areaToSlide > sliderContainerWidth) {
  //     areaToSlide = areaToSlide - parseInt(elementsWidthList[i]);
  //     setCurrentIndex(i);
  //     break;
  //   } else if (areaToSlide === sliderContainerWidth) {
  //     areaToSlide = areaToSlide;
  //     setCurrentIndex(i);
  //     break;
  //   }
  //   areaToSlide += parseInt(elementsWidthList[i]);
  // }

  setCurrentIndex((prev) => prev - 1);
  if (currentIndex <= 0) {
    setCurrentIndex(0);
  }
  areaToSlide = 150;
  if (areaToSlide === NaN) areaToSlide = 0;

  if (totalTranslation >= 0) {
    areaToSlide = 0;
    setTranslated(0);
    totalTranslation = 0;
    slidableContent.style.transform = `translateX(${0}px)`;
    disabled = true;
  } else {
    setTranslated((prev) => {
      totalTranslation = prev + areaToSlide;
      slidableContent.style.transform = `translateX(${totalTranslation}px)`;
      return prev + areaToSlide;
    });
    disabled = false;
  }
  return disabled;
};

export const Tabs = ({ children }) => {
  const sliderRef = useRef(null);
  const sliderContentRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [translated, setTranslated] = useState(0);
  const [prevButtonDisabled, setPrevButtonDisabled] = useState(false);
  const [nextButtonDisabled, setNextButtonDisabled] = useState(false);

  const controlProps = {
    currentIndex,
    sliderContainer: sliderRef?.current,
    setCurrentIndex,
    slidableContent: sliderContentRef?.current,
    translated,
    setTranslated
  };

  return (
    <div className={styles.tabContainerPos}>
      <div className={styles.tabContainer}>
        {/* <button
          className={`${styles.button} ${styles.prevButton}`}
          onClick={() => {
            slidePrev(controlProps);
          }}
          disabled={prevButtonDisabled}
        >
          <MdArrowBackIos />
        </button> */}
        <div className={styles.TabContents}>
          <div className={styles.tabs} ref={sliderRef}>
            <div className={styles.sliderContainer} ref={sliderContentRef}>
              {children}
            </div>
          </div>
        </div>
        {/* <button
          className={`${styles.button} ${styles.nextButton}`}
          onClick={() => {
            slideNext(controlProps);
          }}
          disabled={nextButtonDisabled}
        >
          <MdArrowForwardIos />
        </button> */}
      </div>
    </div>
  );
};

export const Tab = ({ content = <></> }) => {
  const tabRef = useRef(null);
  return (
    <div className={`${styles.singleTab} single-tab`} ref={tabRef} data-width={tabRef?.current?.offsetWidth}>
      {content}
    </div>
  );
};

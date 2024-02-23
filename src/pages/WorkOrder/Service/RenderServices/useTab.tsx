import React, { useCallback, useEffect, useRef, useState } from 'react';

type UseTab = {
  active: boolean;
  activeTabIndex?: number;
  totlaTabs: number;
  gap?: number;
};

const useTab = ({ active, totlaTabs, activeTabIndex = 0, gap = 0 }: UseTab) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState(activeTabIndex);
  const [tabSize, setTabSize] = useState(0);
  const [hasNextTab, setHasNextTab] = useState(true);
  const [hasPrevTab, setHasPrevTab] = useState(true);

  const scrollToActiveTab = useCallback(
    (activeTab: number) => {
      if (containerRef.current && active) {
        const scrollAmmount = activeTab * containerRef.current.clientWidth + gap * activeTab;
        containerRef.current.scrollTo({ top: 0, left: scrollAmmount, behavior: 'smooth' });
      }
    },
    [active, gap]
  );

  const calculatePrevNext = useCallback(
    (tab: number) => {
      if (tab === totlaTabs - 1) {
        setHasNextTab(false);
      } else {
        setHasNextTab(true);
      }
      if (tab === 0) {
        setHasPrevTab(false);
      } else {
        setHasPrevTab(true);
      }
    },
    [totlaTabs]
  );

  const getTabSize = useCallback(() => {
    if (containerRef.current && active) {
      const tabSize = containerRef.current.clientWidth;
      setTabSize(tabSize);
      containerRef.current.style.setProperty('--tab-size', `${tabSize}px`);
    }
  }, [active]);

  const handleNextClick = useCallback(() => {
    const possibleTab = activeTab + 1 === totlaTabs ? totlaTabs : activeTab + 1;
    calculatePrevNext(possibleTab);
    setActiveTab(possibleTab);
    scrollToActiveTab(possibleTab);
    return possibleTab;
  }, [activeTab, scrollToActiveTab, totlaTabs, calculatePrevNext]);

  const handlePrevClick = useCallback(() => {
    const possibleTab = activeTab - 1 === 0 ? 0 : activeTab - 1;
    calculatePrevNext(possibleTab);
    setActiveTab(possibleTab);
    scrollToActiveTab(possibleTab);
    return possibleTab;
  }, [activeTab, scrollToActiveTab, calculatePrevNext]);

  const init = useCallback(() => {
    calculatePrevNext(activeTabIndex);
    setActiveTab(activeTabIndex);
    scrollToActiveTab(activeTabIndex);
    getTabSize();
    return activeTabIndex;
  }, [activeTabIndex, getTabSize, scrollToActiveTab, calculatePrevNext]);

  useEffect(() => {
    init();
  }, [init, active]);

  useEffect(() => {
    window.addEventListener('resize', getTabSize);
    return () => window.removeEventListener('resize', getTabSize);
  }, [getTabSize]);

  return { containerRef, activeTab, tabSize, handleNextClick, handlePrevClick, hasNextTab, hasPrevTab };
};

export default useTab;

import { useCallback, useEffect, useRef, useState } from 'react';

type UseTab = {
  active: boolean;
  activeTabIndex?: number;
  totalTabs: number;
  gap?: number;
  onTabChange: (index: number) => void;
};

const useTab = ({ active, totalTabs, activeTabIndex = 0, gap = 0, onTabChange }: UseTab) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState(activeTabIndex > totalTabs - 1 ? totalTabs - 1 : activeTabIndex < 0 ? 0 : activeTabIndex);
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

  const changeTab = useCallback(
    (tab: number) => {
      setActiveTab(tab);
      scrollToActiveTab(tab);
      onTabChange(tab);
    },
    [scrollToActiveTab]
  );

  const calculatePrevNext = useCallback(
    (tab: number) => {
      if (tab === totalTabs - 1) {
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
    [totalTabs]
  );

  const getTabSize = useCallback(() => {
    if (containerRef.current && active) {
      const tabSize = containerRef.current.clientWidth;
      setTabSize(tabSize);
      containerRef.current.style.setProperty('--tab-size', `${tabSize}px`);
    }
  }, [active]);

  const handleNextClick = useCallback(() => {
    const possibleTab = activeTab + 1 === totalTabs ? totalTabs : activeTab + 1;
    calculatePrevNext(possibleTab);
    setActiveTab(possibleTab);
    scrollToActiveTab(possibleTab);
    onTabChange(possibleTab);
    return possibleTab;
  }, [activeTab, scrollToActiveTab, totalTabs, calculatePrevNext]);

  const handlePrevClick = useCallback(() => {
    const possibleTab = activeTab - 1 === 0 ? 0 : activeTab - 1;
    calculatePrevNext(possibleTab);
    setActiveTab(possibleTab);
    scrollToActiveTab(possibleTab);
    onTabChange(possibleTab);
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

  const recalculateTabSize = useCallback(() => {
    window.requestAnimationFrame(() => {
      getTabSize();
    });
  }, [getTabSize]);

  const hidePrevNext = useCallback(() => {
    if (totalTabs < 2) {
      setHasNextTab(false);
      setHasPrevTab(false);
    }
  }, [totalTabs]);

  useEffect(() => {
    hidePrevNext();
  }, [totalTabs, hidePrevNext]);

  useEffect(() => {
    window.addEventListener('resize', recalculateTabSize);
    return () => window.removeEventListener('resize', recalculateTabSize);
  }, [recalculateTabSize]);

  return { containerRef, activeTab, tabSize, handleNextClick, handlePrevClick, hasNextTab, hasPrevTab, changeTab };
};

export default useTab;

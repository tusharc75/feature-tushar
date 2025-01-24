import { useEffect, useMemo, useRef } from 'react';
import { cn } from 'src/constants/helpers';
import AddSerializedAssets from 'src/pages/ScheduleAndDispatch/Scheduler/AddSerializedAssets';
import AddServices from 'src/pages/ScheduleAndDispatch/Scheduler/AddServices';
import AddTechnicians from 'src/pages/ScheduleAndDispatch/Scheduler/AddTechnician';
import ManageScheduleRental from 'src/pages/ScheduleAndDispatch/Scheduler/ManageScheduleRental';
import { Tab, TabKey } from 'src/pages/ScheduleAndDispatch/Scheduler/types';
import useScheduar from 'src/pages/ScheduleAndDispatch/Scheduler/useScheduar';

const Scheduler = () => {
  const state = useScheduar();
  const { activeTab, tabs, isMobile, activeTabIndex } = state;
  const tabsRef = useRef<Record<TabKey, HTMLLIElement>>({
    assets: null,
    services: null,
    technicians: null,
    customerDetail: null
  });

  useEffect(() => {
    if (activeTab && isMobile) {
      tabsRef.current[activeTab.key]?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  }, [activeTab, isMobile]);

  const filteredTabs = useMemo(()=> tabs?.filter((t)=>t.show),[tabs])

  return (
    <div className="grid min-h-[--min-h] max-w-full grid-cols-1 border [--h:calc(100vh-180px)] [--loader-h:calc(100vh-290px)] [--min-h:500px] md:h-[--h] md:grid-cols-[284px_1fr]">
      <div
        className={`sidebar max-md:hide-scrollbar isolate px-3 py-4 [--gap:18px] max-md:order-2 max-md:overflow-auto max-md:border-t md:h-[--h] md:min-h-[--min-h] md:border-r`}
      >
        <ul className=" flex gap-[--gap] max-md:w-min max-md:flex-row md:flex-col">
          {filteredTabs.map((t, index) => {
            const isActive = index <= activeTabIndex;
            return (
              <li
                ref={(d) => (tabsRef.current[t.key] = d)}
                key={t.key}
                className={cn(
                  'relative flex list-none items-center gap-[12px] rounded-[4px] border px-5 py-[12px] max-md:min-w-[284px] md:flex-shrink-0',
                  isActive ? 'border-[--new-theme-color]' : ''
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border',
                    isActive ? 'border-[--new-theme-color] bg-[--new-theme-color] text-white' : 'border'
                  )}
                >
                  {index + 1}
                </span>
                <div>
                  <span className="text-xs font-semibold leading-[14px] text-gray-600 dark:text-gray-400">Step {index + 1}</span>
                  <p className="text-sm font-semibold leading-[16px] text-[#2E2C2E] dark:text-gray-100">{t.label}</p>
                </div>
                {index !== filteredTabs.length - 1 && (
                  <>
                    <span className="vertical-line absolute left-[34px] top-[calc(100%+1px)] -z-10 h-[--gap] w-[1px] bg-[--common-border-color] max-md:hidden" />
                    <span className="horizontal-line absolute left-[calc(100%+1px)] top-[50%] -z-10 h-[1px] w-[--gap] bg-[--common-border-color] [transform:translateY(-50%)] md:hidden" />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="sidebar overflow-x-auto px-3 py-4">
        <RenderTab activeTab={activeTab} tabKey="assets">
          <AddSerializedAssets schedularState={state} />
        </RenderTab>
        <RenderTab activeTab={activeTab} tabKey="services">
          <AddServices schedularState={state} />
        </RenderTab>
        <RenderTab activeTab={activeTab} tabKey="technicians">
          <AddTechnicians schedularState={state} />
        </RenderTab>
        <RenderTab activeTab={activeTab} tabKey="customerDetail">
          <ManageScheduleRental schedularState={state} />
        </RenderTab>
      </div>
    </div>
  );
};

export default Scheduler;

const RenderTab = ({ activeTab, tabKey, children }: { activeTab: Tab; tabKey: TabKey; children: React.ReactNode }) => {
  if (activeTab?.key === tabKey) {
    return <div>{children}</div>;
  }
  return null;
};

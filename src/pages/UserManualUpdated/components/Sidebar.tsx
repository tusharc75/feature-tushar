import { ExpandMore } from '@mui/icons-material';
import React, { useEffect, useMemo } from 'react';
import { cn } from 'src/constants/helpers';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/pages/UserManual/components/Accordion';
import { UseUsermanual } from '../types';
import { useUserManualStore } from '../hooks/useUsermanual';
import { getSectionFromLocation } from '../utils';

const Sidebar = ({ state }: { state: UseUsermanual }) => {
  const [isMobile] = useUserManualStore((store) => store.isMobile);
  const [leftSidebarData] = useUserManualStore((store) => store.leftSidebarData);

  const [isSidebarOpen] = useUserManualStore((store) => store.isSidebarOpen);
  const [currentRoute] = useUserManualStore((store) => store.currentRoute);
  const [toggleSidebar, setStore] = useUserManualStore((store) => store.toggleSidebar);
  const { navigate } = state;
  const sections = useMemo(() => getSectionFromLocation(currentRoute), [currentRoute]);

  return (
    <aside
      className={cn(
        ' -mt-[var(--manual-head-height)]  flex-shrink-0 bg-[white] [border-right:1px_solid_var(--common-border-color)] dark:bg-neutral-900'
      )}
    >
      <div
        className={cn(
          ' sticky top-0 h-full max-h-screen',
          isMobile ? 'fixed bottom-0 top-0 z-40 h-screen bg-[white] transition-all duration-200 dark:bg-neutral-900' : '',
          isSidebarOpen ? 'left-0' : '-left-[--manual-sidebar-width]'
        )}
      >
        <div className="flex h-full w-[--manual-sidebar-width] flex-col pt-[var(--manual-head-height)]">
          <nav className=" flex-grow overflow-auto p-2">
            <ul className="flex flex-col gap-1">
              {leftSidebarData.map((section) => (
                <li key={section.sectionName}>
                  <Accordion className="list-none dark:bg-[#1b1b1d]" key={section.sectionName} defaultExpanded={sections[0] === section.sectionName}>
                    <AccordionSummary
                      className={cn(
                        'hover:bg-gray-100 dark:hover:bg-[#272729]',
                        section.sectionName === sections[0] ? '!bg-gray-100 dark:!bg-[#272729]' : ''
                      )}
                      expandIcon={<ExpandMore />}
                      dataActive={section.sectionName === sections[0]}
                    >
                      <span className="px-1 py-2 text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">{section.sectionName}</span>
                    </AccordionSummary>
                    <AccordionDetails>
                      <ul className="ml-4 grid list-none gap-1 p-1">
                        {section.resource.map((resource) => {
                          const encodedLabel = encodeURIComponent(resource.resourceLabel);
                          const link = `/${section.sectionName}/${encodedLabel}`;
                          return (
                            <li
                              key={resource._id}
                              className={cn(
                                'cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#272729]',
                                sections[0] === section.sectionName && sections[1] === resource.resourceLabel && 'bg-gray-200 dark:bg-[#272729]'
                              )}
                              onClick={() => {
                                navigate({ route: link });
                                window.scrollTo({
                                  top: 0,
                                  left: 0,
                                  behavior: 'instant'
                                });
                              }}
                            >
                              <span className="text-[14px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">
                                {resource.resourceLabel}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </AccordionDetails>
                  </Accordion>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      {isSidebarOpen && isMobile && <div className="fixed inset-0 z-30 bg-black/50" onClick={() => setStore((prev) => toggleSidebar(prev))}></div>}
    </aside>
  );
};

export default Sidebar;

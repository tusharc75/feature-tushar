import { ExpandMore } from '@mui/icons-material';
import React from 'react';
import { cn } from 'src/constants/helpers';
import { Accordion, AccordionSummary, AccordionDetails } from 'src/pages/UserManual/components/Accordion';
import { ComponentCommonProps } from 'src/pages/UserManual/type';
import { getSectionFromUrl } from 'src/pages/UserManual/utils';

const ManualSidebar = ({ state }: ComponentCommonProps) => {
  const { manualData, navigate, currentRoute, isMobile, isSidebarOpen } = state;
  const sections = getSectionFromUrl(currentRoute);

  return (
    <aside
      className={cn(
        ' -mt-[var(--manual-head-height)]  flex-shrink-0 bg-[white] [border-right:1px_solid_var(--common-border-color)] dark:bg-[#1b1b1d]'
      )}
    >
      <div
        className={cn(
          ' sticky top-0 h-full max-h-screen',
          isMobile ? 'fixed bottom-0 top-0 z-40 h-screen bg-[white] transition-all duration-200' : '',
          isSidebarOpen ? 'left-0' : '-left-[--manual-sidebar-width]'
        )}
      >
        <div className="flex h-full w-[--manual-sidebar-width] flex-col pt-[var(--manual-head-height)]">
          <nav className=" flex-grow overflow-auto p-2">
            <ul className="flex flex-col gap-1">
              {manualData.map((section) => (
                <Accordion
                  component={'li'}
                  className="list-none dark:bg-[#1b1b1d]"
                  key={section.sectionName}
                  defaultExpanded={sections[0] === section.sectionName}
                >
                  <AccordionSummary className="hover:bg-gray-100 dark:hover:bg-[#272729]" expandIcon={<ExpandMore />}>
                    <span className="px-1 py-2 text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">{section.sectionName}</span>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ul className="ml-4 grid list-none gap-1 p-1">
                      {section.resource.map((resource) => (
                        <li
                          key={resource._id}
                          className={cn(
                            'cursor-pointer rounded-md px-3 py-2 hover:bg-gray-100 dark:hover:bg-[#272729]',
                            sections[0] === section.sectionName && sections[1] === resource.resourceLabel && 'bg-gray-100 dark:bg-[#272729]'
                          )}
                          onClick={() => {const encodedLabel = encodeURIComponent(resource.resourceLabel);
                            navigate(`/${section.sectionName}/${encodedLabel}`);}}
                        >
                          <span className="text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">{resource.resourceLabel}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionDetails>
                </Accordion>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      {isSidebarOpen && isMobile && <div className="fixed inset-0 z-30 bg-black/50" onClick={state.toggleSidebar}></div>}
    </aside>
  );
};

export default ManualSidebar;

import { Accordion, AccordionDetails, AccordionSummary, CircularProgress } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { kebabCase } from 'lodash';
import React from 'react';
import { ComponentCommonProps, Section } from 'src/pages/UserManual/type';

const ManualContent = ({ state }: ComponentCommonProps) => {
  const { pageData, loading, isMobile } = state;
  return (
    <main className="relative flex min-h-screen flex-grow bg-[white] dark:bg-[#1b1b1d]">
      {loading ? (
        <div className="absolute inset-0 left-1/2 top-1/2 z-10 h-fit w-fit [transform:translate(-50%,-50%)]">
          <CircularProgress className="!text-gray-400" />
        </div>
      ) : (
        <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
          <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
            {pageData?.map((e, i) => (
              <>
                <div key={e._id} id={kebabCase(`${e.sectionName}-section-id`)} className="scroll-m-[calc(var(--manual-head-height)+20px)]">
                  <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{e.sectionName}</h2>
                  <div className="prose mt-4 max-w-full dark:prose-invert [&_img]:max-w-full " dangerouslySetInnerHTML={{ __html: e.content }}></div>
                </div>
                {e.subSections?.length > 0 &&
                  e.subSections.map((subSection, i) => (
                    <div
                      key={subSection._id}
                      id={kebabCase(`${subSection.sectionName}-section-id`)}
                      className="scroll-m-[calc(var(--manual-head-height)+20px)]"
                    >
                      <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{subSection.sectionName}</h2>
                      <div
                        className="prose mt-4 max-w-full dark:prose-invert [&_img]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: subSection.content }}
                      ></div>
                    </div>
                  ))}
              </>
            ))}
          </div>
          <div className="basis-full px-4 lg:basis-1/4">
            {isMobile ? (
              <Accordion elevation={0} className="!rounded-lg dark:bg-[#242526]">
                <AccordionSummary expandIcon={<ExpandMore />} className="[&.Mui-expanded]:![border-bottom:1px_solid_var(--common-border-color)]">
                  On This Page
                </AccordionSummary>
                <AccordionDetails>
                  <OnThisPageImpl pageData={pageData} />
                </AccordionDetails>
              </Accordion>
            ) : (
              <OnThisPageImpl pageData={pageData} />
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default ManualContent;

const OnThisPageImpl = ({ pageData }: { pageData: Section[] }) => {
  return (
    <ul className="sticky top-[--manual-head-height] list-none pb-2 pl-2 pr-0 pt-2 lg:[border-left:1px_solid_var(--common-border-color)] ">
      {pageData?.map((e) => (
        <li className="m-2 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">
          <a key={e._id} href={`#${kebabCase(e.sectionName)}-section-id`} className="text-[12px] hover:text-[var(--link)]">
            {e.sectionName}
          </a>
          {e?.subSections?.length ? <SubOnThisPageImpl pageData={e?.subSections} /> : null}
        </li>
      ))}
    </ul>
  );
};

const SubOnThisPageImpl = ({ pageData }: { pageData: Section[] }) => {
  return (
    <ul className="sticky top-[--manual-head-height] list-none pl-2 pr-0">
      {pageData?.map((e) => (
        <li className="m-1.5 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">
          <a key={e._id} href={`#${kebabCase(e.sectionName)}-section-id`} className="text-[12px] hover:text-[var(--link)]">
            {e.sectionName}
          </a>
        </li>
      ))}
    </ul>
  );
};

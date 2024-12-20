import { Accordion, AccordionDetails, AccordionSummary, CircularProgress } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { kebabCase } from 'lodash';
import { useState } from 'react';
import { ComponentCommonProps, Section } from 'src/pages/UserManual/type';

const LazyImage = ({ src, alt }: { src: string; alt?: string }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {!loaded && <div className="absolute inset-0 h-full w-full bg-gray-300 animate-pulse rounded"></div>}
      <img
        src={src}
        alt={alt || 'Image'}
        loading="lazy"
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
};

const ManualContent = ({ state }: ComponentCommonProps) => {
  const { pageData, loading, isMobile } = state;
  const [zoomedImage, setZoomedImage] = useState(null);

  const handleClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setZoomedImage(e.target);
    }
  };

  const renderContent = (content: string) => {
    const regex = /<img[^>]+src="([^">]+)"[^>]*>/g;
    return content.split(regex).map((part, index) => {
      const match = regex.exec(content);
      if (match) {
        return <LazyImage key={index} src={match[1]} alt={match[2] || 'Image'} />;
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

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
              <div key={e._id} id={kebabCase(`${e.sectionName}-section-id`)} className="scroll-m-[calc(var(--manual-head-height)+20px)]">
                <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{e.sectionName}</h2>
                <div
                  className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer"
                  onClick={handleClick}
                >
                  {renderContent(e.content)}
                </div>
              </div>
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
          {zoomedImage && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setZoomedImage(null)}>
              <img src={zoomedImage?.src} alt={zoomedImage?.alt} className="object-contain rounded-lg shadow-lg" />
            </div>
          )}
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

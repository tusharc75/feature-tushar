import { Close, ContentCopy, ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, IconButton } from '@mui/material';
import { kebabCase } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import ImageZoomPan from 'src/components/ImageZoomPan';
import { cn } from 'src/constants/helpers';
import { ComponentCommonProps, Section } from 'src/pages/UserManual/type';
import { useAutoTOC } from 'src/pages/UserManual/hooks/useAutoTOC';
import styles from '../userManual.module.scss';

const ManualContent = ({ state }: ComponentCommonProps) => {
  const { pageData, loading, isMobile } = state;
  const imagesLoaded = useRef(0);
  const totalImages = useRef(0);
  const mainContainerRef = useRef<HTMLElement>(null);
  const [isImageLoading, setIsImageloading] = useState(false);
  const autoTOC = useAutoTOC('.manual-content-section', pageData);

  const scrollToHash = useCallback(() => {
    if (window.location.hash) {
      try {
        const hash = decodeURIComponent(window.location.hash);
        const targetElement = document.querySelector(hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error('Error scrolling to hash:', error);
      }
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    imagesLoaded.current++;
    if (imagesLoaded.current === totalImages.current) {
      scrollToHash();
      setIsImageloading(false);
    }
  }, [scrollToHash]);

  useEffect(() => {
    let allImagesTillSection: HTMLImageElement[];
    if (!loading && window.location.hash !== '') {
      setIsImageloading(true);
      imagesLoaded.current = 0;

      setTimeout(() => {
        try {
          const hash = decodeURIComponent(window.location.hash.substring(1));
          const allSections = document.querySelectorAll('[id*="-section-id"]');
          const sectionIndex = [...allSections].findIndex((d) => d.id === hash);
          const sections = sectionIndex > -1 ? [...allSections].splice(0, sectionIndex) : [...allSections];
          allImagesTillSection = sections.map((s) => [...s.querySelectorAll('img')]).flat();

          totalImages.current = allImagesTillSection.length;

          if (totalImages.current === 0) {
            scrollToHash();
            setIsImageloading(false);
            return;
          }

          allImagesTillSection?.forEach((img) => {
            if (img.complete) {
              imagesLoaded.current++;
              if (imagesLoaded.current === totalImages.current) {
                scrollToHash();
                setIsImageloading(false);
              }
            } else {
              img.addEventListener('load', handleImageLoad);
              img.addEventListener('error', handleImageLoad);
            }
          });

          // If all images are already loaded
          if (imagesLoaded.current === totalImages.current) {
            scrollToHash();
            setIsImageloading(false);
          }
        } catch (error) {
          console.error('Error in image loading:', error);
          setIsImageloading(false);
        }
      }, 0);
    } else {
      setIsImageloading(false);
    }

    return () => {
      allImagesTillSection?.forEach((img) => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
      imagesLoaded.current = 0;
      totalImages.current = 0;
    };
  }, [handleImageLoad, loading, scrollToHash]);

  const [zoomedImage, setZoomedImage] = useState(null);
  const handleClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setZoomedImage(e.target);
    }
  };

  useEffect(() => {
    if (zoomedImage) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [zoomedImage]);

  useEffect(() => {
    mainContainerRef.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [pageData]);

  const handleCopyLink = (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <main ref={mainContainerRef} className="relative flex min-h-screen flex-grow scroll-m-24 bg-[white] dark:bg-[#1b1b1d]">
      {loading ? (
        <div className="absolute inset-0 left-1/2 top-1/2 z-10 h-fit w-fit [transform:translate(-50%,-50%)]">
          <CircularProgress className="!text-gray-400" />
        </div>
      ) : (
        <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
          {isImageLoading && <CircularProgress className="fixed" size={16} />}
          <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
            {pageData?.map((e, i) => (
              <div key={e._id}>
                <div id={kebabCase(`${e.sectionName}-section-id`)} className={cn("manual-content-section scroll-m-[calc(var(--manual-head-height)+20px)]", styles['manual-content-section'])}>
                  <div className="group flex items-center gap-2">
                    <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{e.sectionName}</h2>
                    <IconButton
                      onClick={() => handleCopyLink(kebabCase(`${e.sectionName}-section-id`))}
                      size="small"
                      className="!p-1 !text-gray-400 hover:!text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy link"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </div>
                  <div
                    className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer"
                    dangerouslySetInnerHTML={{ __html: e.content }}
                    onClick={handleClick}
                  ></div>
                </div>
                {e.subSections?.length > 0 &&
                  e.subSections.map((subSection, i) => (
                    <div
                      key={subSection._id}
                      id={kebabCase(`${subSection.sectionName}-section-id`)}
                      className={cn("manual-content-section scroll-m-[calc(var(--manual-head-height)+20px)]", styles['manual-content-section'])}
                    >
                      <div className="group flex items-center gap-2">
                        <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{subSection.sectionName}</h2>
                        <IconButton
                          onClick={() => handleCopyLink(kebabCase(`${subSection.sectionName}-section-id`))}
                          size="small"
                          className="!p-1 !text-gray-400 hover:!text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy link"
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </div>
                      <div
                        className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer"
                        onClick={handleClick}
                        dangerouslySetInnerHTML={{ __html: subSection.content }}
                      ></div>
                    </div>
                  ))}
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
                  <OnThisPageImpl pageData={pageData} autoTOC={autoTOC} />
                </AccordionDetails>
              </Accordion>
            ) : (
              <OnThisPageImpl pageData={pageData} autoTOC={autoTOC} />
            )}
          </div>
          {zoomedImage && (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="flex min-h-[50px] w-full items-center justify-between gap-2 border-b bg-[--dark-primary,var(--primary)] px-4 py-3 text-white">
                <h2>Preview</h2>
                <IconButton onClick={() => setZoomedImage(null)} size="small" className="text-white">
                  <Close color="inherit" />
                </IconButton>
              </div>
              <div className="flex w-full flex-grow flex-col items-center justify-center bg-[--dark-secondary,white] p-4">
                <div className="mx-auto flex w-full flex-grow items-center justify-center">
                  <ImageZoomPan src={zoomedImage?.src} alt={zoomedImage?.alt} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ManualContent;

const OnThisPageImpl = ({ pageData, autoTOC }: { pageData: Section[], autoTOC: any[] }) => {
  const hash = window.location.hash.split('#')[1];

  return (
    <ul className="sticky top-[--manual-head-height] list-none pb-2 pl-2 pr-0 pt-2 lg:[border-left:1px_solid_var(--common-border-color)] overflow-y-auto h-[calc(100vh-2rem)]">
      {pageData?.map((e) => {
        const sectionId = `${kebabCase(e.sectionName)}-section-id`;
        const sectionTOC = Array.isArray(autoTOC)
          ? autoTOC.filter(t => t.sectionId === sectionId)
          : [];

        return (
          <li className="m-2 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100" key={e._id}>
            <a href={`#${sectionId}`} className={cn('text-[12px] hover:text-[var(--link)]', hash === sectionId && 'font-bold')}>
              {e.sectionName}
            </a>

            {sectionTOC.length > 0 && (
              <ul className="mt-1 pl-4">
                {sectionTOC.map((tocItem) => (
                  <li key={tocItem.id} className="m-1.5 list-none">
                    <a
                      href={`#${tocItem.id}`}
                      className={cn(
                        'text-[12px] hover:text-[var(--link)]',
                        hash === tocItem.id && 'font-bold'
                      )}
                    >
                      {tocItem.text}
                    </a>
                    {tocItem.children && tocItem.children.length > 0 && (
                      <ul className="pl-4">
                        {tocItem.children.map((child) => (
                          <li key={child.id} className="m-1.5 list-none">
                            <a
                              href={`#${child.id}`}
                              className={cn(
                                'text-[12px] hover:text-[var(--link)]',
                                hash === child.id && 'font-bold'
                              )}
                            >
                              {child.text}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {e?.subSections?.length ? <SubOnThisPageImpl pageData={e?.subSections} /> : null}
          </li>
        );
      })}
    </ul>
  );
};

const SubOnThisPageImpl = ({ pageData }: { pageData: Section[] }) => {
  const hash = window.location.hash.split('#')[1];
  return (
    <ul className="sticky top-[--manual-head-height] list-none pl-2 pr-0">
      {pageData?.map((e) => {
        const link = `${kebabCase(e.sectionName)}-section-id`;
        return (
          <li className="m-1.5 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100">
            <a key={e._id} href={`#${link}`} className={cn('text-[12px] hover:text-[var(--link)]', hash === link && 'font-bold')}>
              {e.sectionName}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

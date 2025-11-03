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
  const { pageData, loading, isMobile, currentRoute } = state;
  const imagesLoaded = useRef(0);
  const totalImages = useRef(0);
  const mainContainerRef = useRef<HTMLElement | null>(null);
  const autoTOC = useAutoTOC('.manual-content-section', pageData);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<any>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    typeof window !== 'undefined' && window.location.hash ? decodeURIComponent(window.location.hash.replace('#', '')) : null
  );
  const lastActiveRef = useRef<string | null>(activeSectionId);

  const addHeadingAnchors = useCallback(() => {
    const contentSections = document.querySelectorAll('.manual-content-section');
    contentSections.forEach((section) => {
      const sectionId = section.id || kebabCase('section');
      const headings = section.querySelectorAll('.prose h2, .prose h3, .prose h4, .prose h5, .prose h6');

      headings.forEach((heading) => {
        if (heading.hasAttribute('data-anchor-processed')) return;
        const headingText = heading.textContent?.trim() || '';
        if (!headingText) return;

        const headingId = `${sectionId}--${kebabCase(headingText)}`;
        heading.setAttribute('id', headingId);
        heading.setAttribute('data-anchor-processed', 'true');

        const wrapper = document.createElement('div');
        wrapper.className = 'group relative flex items-center gap-2';
        const headingContent = document.createElement('span');
        headingContent.innerHTML = heading.innerHTML;

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-heading-button opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded relative';
        copyButton.setAttribute('aria-label', 'Copy link to this section');
        copyButton.setAttribute('title', 'Copy link');
        copyButton.setAttribute('data-heading-id', headingId);
        copyButton.innerHTML = `
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;

        const feedbackSpan = document.createElement('span');
        feedbackSpan.className = 'absolute -bottom-6 left-0 rounded bg-gray-500 px-2 py-1 text-[10px] text-white shadow-md opacity-0 transition-opacity duration-300 pointer-events-none';
        feedbackSpan.textContent = 'Copied';
        copyButton.appendChild(feedbackSpan);
        copyButton.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const url = `${window.location.origin}${window.location.pathname}#${headingId}`;

          navigator.clipboard.writeText(url).then(() => {
            feedbackSpan.style.opacity = '1';

            setTimeout(() => {
              feedbackSpan.style.opacity = '0';
            }, 2000);
          });
        };
        heading.innerHTML = '';
        wrapper.appendChild(headingContent);
        wrapper.appendChild(copyButton);
        heading.appendChild(wrapper);
      });
    });
  }, []);


  useEffect(() => {
    if (!loading && pageData && pageData.length > 0) {
      setTimeout(() => {
        addHeadingAnchors();
      }, 100);
    }
  }, [loading, pageData, addHeadingAnchors]);

  useEffect(() => {
    if (loading || !pageData || pageData.length === 0) return;

    const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.prose img'));
    if (imgs.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const img = entry.target as HTMLImageElement;
          if (!img) return;

          if (entry.isIntersecting) {
            const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-src-fallback');
            if (dataSrc && !img.getAttribute('src')) {
              img.setAttribute('src', dataSrc);
            }
          }
        });
      },
      { root: null, rootMargin: '200px 0px', threshold: 0.01 }
    );

    const createdSkeletons = new Map<HTMLImageElement, HTMLElement>();

    imgs.forEach((img) => {
      if (img.dataset.lazyProcessed === 'true') {
        io.observe(img);
        return;
      }

      const originalSrc = img.getAttribute('src') ?? '';
      if (originalSrc) img.setAttribute('data-src', originalSrc);
      img.removeAttribute('src');

      img.dataset.lazyProcessed = 'true';
      img.style.opacity = '0';

      const skeleton = document.createElement('div');
      skeleton.className = 'image-skeleton animate-pulse bg-gray-200 dark:bg-gray-700 w-full';
      skeleton.style.minHeight = img.getAttribute('height') ? `${img.getAttribute('height')}px` : (img.height ? `${img.height}px` : '300px');
      skeleton.style.display = 'block';
      skeleton.style.width = '100%';
      skeleton.style.marginBottom = '0.5rem';

      img.parentElement?.insertBefore(skeleton, img);
      createdSkeletons.set(img, skeleton);

      const onLoad = () => {
        const s = createdSkeletons.get(img);
        if (s && s.parentElement) s.parentElement.removeChild(s);
        img.style.transition = 'opacity 200ms';
        img.style.opacity = '1';
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onErr);
        createdSkeletons.delete(img);
      };
      const onErr = () => {
        const s = createdSkeletons.get(img);
        if (s && s.parentElement) s.parentElement.removeChild(s);
        img.style.opacity = '1';
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onErr);
        createdSkeletons.delete(img);
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onErr);

      io.observe(img);
    });

    return () => {
      io.disconnect();
      createdSkeletons.forEach((s, img) => {
        try { if (s.parentElement) s.parentElement.removeChild(s); } catch { }
        try { img.removeEventListener('load', () => { }); img.removeEventListener('error', () => { }); } catch { }
      });
      createdSkeletons.clear();
    };
  }, [loading, pageData]);


  const scrollToHash = useCallback(() => {
    if (window.location.hash) {
      try {
        const hash = decodeURIComponent(window.location.hash.replace('#', ''));
        setActiveSectionId(hash);
        const targetElement = document.getElementById(hash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } catch (error) {
        console.error('Error scrolling to hash:', error);
      }
    }
  }, [currentRoute]);

  const handleImageLoad = useCallback(() => {
    imagesLoaded.current++;
    if (imagesLoaded.current === totalImages.current) {
      scrollToHash();
    }
  }, [scrollToHash]);

  useEffect(() => {
    let allImagesTillSection: HTMLImageElement[] = [];
    if (!loading && window.location.hash !== '') {
      imagesLoaded.current = 0;
      setTimeout(() => {
        try {
          const hash = decodeURIComponent(window.location.hash.substring(1));
          setActiveSectionId(hash);
          const allSections = document.querySelectorAll('[id*="-section-id"]');
          const sectionIndex = [...allSections].findIndex((d) => d.id === hash);
          const sections = sectionIndex > -1 ? [...allSections].splice(0, sectionIndex) : [...allSections];
          allImagesTillSection = sections.map((s) => [...s.querySelectorAll('img')]).flat();
          totalImages.current = allImagesTillSection.length;

          if (totalImages.current === 0) {
            scrollToHash();
            return;
          }

          allImagesTillSection.forEach((img) => {
            if (img.complete) {
              imagesLoaded.current++;
              if (imagesLoaded.current === totalImages.current) {
                scrollToHash();
              }
            } else {
              img.addEventListener('load', handleImageLoad);
              img.addEventListener('error', handleImageLoad);
            }
          });

          if (imagesLoaded.current === totalImages.current) {
            scrollToHash();
          }
        } catch (error) {
          console.error('Error in image loading:', error);
        }
      }, 0);
    } else {
    }
    return () => {
      allImagesTillSection.forEach((img) => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
      imagesLoaded.current = 0;
      totalImages.current = 0;
    };
  }, [handleImageLoad, loading, scrollToHash]);

  useEffect(() => {
    if (!window.location.hash && pageData && pageData.length > 0 && mainContainerRef.current) {
      const firstSectionId = kebabCase(`${pageData[0].sectionName}-section-id`);
      setActiveSectionId(firstSectionId);
      mainContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pageData]);

  const handleClick = (e) => {
    if (e.target.tagName === 'IMG') {
      setZoomedImage(e.target);
    }
  };
  console.log(pageData)

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

  useEffect(() => {
    if (!pageData || pageData.length === 0) return;
    const sectionEls = Array.from(document.querySelectorAll<HTMLElement>('[id*="-section-id"]'));
    if (sectionEls.length === 0) return;

    let observer: IntersectionObserver | null = null;
    const onIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries.filter((e) => e.isIntersecting && e.target instanceof HTMLElement);
      if (visible.length === 0) return;

      visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      const topEntry = visible[0];
      const candidateId = (topEntry.target as HTMLElement).id;
      const candidateRatio = topEntry.intersectionRatio;

      const currentId = lastActiveRef.current;

      if (!currentId) {
        lastActiveRef.current = candidateId;
        setActiveSectionId(candidateId);
        try { history.replaceState(null, '', `#${candidateId}`); } catch { }
        return;
      }

      if (candidateId === currentId) return;

      const currentEntry = entries.find(e => e.target instanceof HTMLElement && (e.target as HTMLElement).id === currentId);
      const currentRatio = currentEntry ? currentEntry.intersectionRatio : 0;
      if (candidateRatio >= 0.5 || candidateRatio >= currentRatio + 0.15) {
        lastActiveRef.current = candidateId;
        setActiveSectionId(candidateId);
        try { history.replaceState(null, '', `#${candidateId}`); } catch (err) { console.error('Error updating URL hash:', err); }
      }
    };
    observer = new IntersectionObserver(onIntersect, {
      root: null,
      rootMargin: '-10% 0px -40% 0px',
      threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.9, 1],
    });

    sectionEls.forEach(el => observer!.observe(el));
    return () => {
      if (observer) {
        sectionEls.forEach(el => observer!.unobserve(el));
        observer.disconnect();
      }
    };
  }, [pageData, activeSectionId]);

  const handleTOCItemClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
      setActiveSectionId(id);
    }
  };

  const handleCopyLink = (sectionId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    });
  };

  const renderSection = (section: Section, parentPath: string = '', level: number = 0) => {
    const sectionId = kebabCase(`${parentPath ? `${parentPath}-` : ''}${section.sectionName}-section-id`);
    const isActive = activeSectionId === sectionId;
    const newParentPath = parentPath ? `${parentPath}-${section.sectionName}` : section.sectionName;

    return (
      <div key={section._id}>
        <div
          id={sectionId}
          className={cn(
            'manual-content-section scroll-m-[calc(var(--manual-head-height)+20px)]',
            styles['manual-content-section'],
            isActive && styles.activeSectionHighlight
          )}
        >
          <div className="group relative flex items-center gap-2">
            <h2 className={cn(
              'my-7 pb-2 font-bold leading-[1.25] text-gray-500 dark:text-gray-300',
              level === 0 ? 'text-[25px] lg:text-[32px]' : 'text-[20px] lg:text-[24px]'
            )}>
              {section.sectionName}
            </h2>
            <div className="relative">
              <IconButton
                onClick={() => handleCopyLink(sectionId)}
                size="small"
                className="!p-1 !text-gray-400 opacity-0 transition-opacity hover:!text-gray-600 group-hover:opacity-100"
                title="Copy link"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
              {copiedSection === sectionId && (
                <span className="absolute -bottom-6 left-0 rounded bg-gray-500 px-2 py-1 text-[10px] text-white shadow-md">
                  Copied
                </span>
              )}
            </div>
          </div>
          {section.content && (
            <div
              className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer"
              dangerouslySetInnerHTML={{ __html: section.content }}
              onClick={handleClick}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <main ref={mainContainerRef} className="relative flex min-h-screen flex-grow scroll-m-24 bg-[white] dark:bg-[#1b1b1d]">
      {loading ? (
        <div className="absolute inset-0 left-1/2 top-1/2 z-10 h-fit w-fit [transform:translate(-50%,-50%)]">
          <CircularProgress className="!text-gray-400" />
        </div>
      ) : (
        <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
          <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
            {pageData?.map(section => renderSection(section))}
          </div>
          <div className="basis-full px-4 lg:basis-1/4">
            {isMobile ? (
              <Accordion elevation={0} className="!rounded-lg dark:bg-[#242526]">
                <AccordionSummary expandIcon={<ExpandMore />} className="[&.Mui-expanded]:![border-bottom:1px_solid_var(--common-border-color)]">
                  On This Page
                </AccordionSummary>
                <AccordionDetails>
                  <OnThisPageImpl
                    pageData={pageData}
                    autoTOC={autoTOC}
                    activeSectionId={activeSectionId}
                    onItemClick={handleTOCItemClick}
                  />
                </AccordionDetails>
              </Accordion>
            ) : (
              <OnThisPageImpl
                pageData={pageData}
                autoTOC={autoTOC}
                activeSectionId={activeSectionId}
                onItemClick={handleTOCItemClick}
              />
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

interface TOCItem {
  id: string;
  text: string;
  level: number;
  sectionId: string;
  children: TOCItem[];
}

interface SectionTOC {
  sectionId: string;
  toc: TOCItem[];
}

const renderTOCItems = (items: TOCItem[], activeId: string | null, onItemClick: (id: string) => void) => (
  <ul className="mt-1 pl-4">
    {items.map(item => (
      <li key={item.id} className="m-1.5 list-none">
        <button
          data-toc-id={item.id}
          onClick={ev => {
            ev.preventDefault();
            onItemClick(item.id);
          }}
          className={cn(
            'text-[12px] hover:text-[var(--link)] text-left w-full focus:outline-none focus:ring-0 bg-transparent active:bg-transparent transition-all',
            activeId === item.id ? 'font-bold !text-[var(--link)]' : ''
          )}
        >
          {item.text}
        </button>
        {item.children.length > 0 && renderTOCItems(item.children, activeId, onItemClick)}
      </li>
    ))}
  </ul>
);

const OnThisPageImpl = ({
  pageData,
  autoTOC,
  activeSectionId,
  onItemClick,
}: {
  pageData: Section[];
  autoTOC: SectionTOC[];
  activeSectionId: string | null;
  onItemClick: (id: string) => void;
}) => {
  const tocContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!tocContainerRef.current || !activeSectionId) return;

    const activeButton = tocContainerRef.current.querySelector(
      `button[data-toc-id="${activeSectionId}"]`
    );

    if (activeButton) {
      const container = tocContainerRef.current;
      const activeElement = activeButton as HTMLElement;

      const containerHeight = container.clientHeight;
      const activeTop = activeElement.offsetTop;
      const activeHeight = activeElement.clientHeight;

      const scrollTarget = activeTop - (containerHeight / 2) + (activeHeight / 2);

      container.scrollTo({
        top: Math.max(0, scrollTarget),
        behavior: 'smooth',
      });
    }
  }, [activeSectionId]);

  return (
    <ul
      ref={tocContainerRef}
      className="sticky top-[--manual-head-height] h-[calc(100vh-2rem)] list-none overflow-y-auto pb-2 pl-2 pr-0 pt-2 lg:[border-left:1px_solid_var(--common-border-color)]"
    >
      {pageData.map(section => {
        const sectionId = `${kebabCase(section.sectionName)}-section-id`;
        const tocEntry = autoTOC.find(t => t.sectionId === sectionId);
        const sectionTOC = tocEntry ? tocEntry.toc : [];
        return (
          <li
            key={section._id}
            className="mb-1.5 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100"
          >
            {sectionTOC.length > 0 && renderTOCItems(sectionTOC, activeSectionId, onItemClick)}
          </li>
        );
      })}
    </ul>
  );
};


import { Close, ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, IconButton } from '@mui/material';
import { useEffect, useRef } from 'react';
import ImageZoomPan from 'src/components/ImageZoomPan';
import { cn } from 'src/constants/helpers';
import useContent from '../hooks/useContent';
import useHeadingNode from '../hooks/useHeadingNode';
import { HeadingNode, UseUsermanual } from '../types';
import CopyButton from './CopyButton';
import { dispatchHashChangeEvent, NavSidebar } from './NavSidebar';
import { makeSafeId } from '../utils';

const Content = ({ state }: { state: UseUsermanual }) => {
  const { data, handleClick, zoomedImage, loading, isMobile, mainContainerRef, setZoomedImage, isScrolling } = useContent();

  const { tree } = useHeadingNode(data);

  return (
    <main className="relative flex min-h-screen flex-grow scroll-m-24 bg-[white] dark:bg-[#1b1b1d]">
      {loading ? (
        <div className="absolute inset-0 left-1/2 top-1/2 z-10 h-fit w-fit [transform:translate(-50%,-50%)]">
          <CircularProgress className="!text-gray-400" />
        </div>
      ) : (
        <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
          <div className="order-2 w-full px-4 lg:order-1 lg:w-3/4">
            <div key={data?._id}>
              <div id={makeSafeId(data?.sectionName)} className={cn('manual-content-section scroll-m-[calc(var(--manual-head-height)+20px)]')}>
                <div className="group flex items-center gap-2">
                  <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{data?.sectionName}</h2>
                  <CopyButton title={data?.sectionName} />
                </div>
                <div onClick={handleClick} id="prose-content" ref={mainContainerRef}>
                  <RenderContent tree={tree} mainContainerRef={mainContainerRef} isScrolling={isScrolling} />
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 w-full px-4 lg:order-2 lg:w-1/4">
            {isMobile ? (
              <>
                <Accordion elevation={0} className="!rounded-lg dark:bg-[#242526]">
                  <AccordionSummary expandIcon={<ExpandMore />} className="[&.Mui-expanded]:![border-bottom:1px_solid_var(--common-border-color)]">
                    On This Page
                  </AccordionSummary>
                  <AccordionDetails>
                    <NavSidebar tree={tree} />
                  </AccordionDetails>
                </Accordion>
              </>
            ) : (
              <NavSidebar tree={tree} />
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

export default Content;

const RenderContent = ({
  tree,
  mainContainerRef,
  isScrolling
}: {
  tree: HeadingNode[];
  mainContainerRef: React.MutableRefObject<HTMLDivElement>;
  isScrolling: boolean;
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headings = mainContainerRef?.current.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id], h4[id]');
    if (!headings)
      return () => {
        observerRef.current?.disconnect();
      };

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first visible heading
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible?.target) {
          const id = visible.target.getAttribute('id');
          if (id && !isScrolling) {
            dispatchHashChangeEvent({ hash: `#${id}` });
            window.history.replaceState(null, '', `#${id}`);
          }
        }
      },
      {
        rootMargin: '0px 0px -70% 0px', // trigger when heading is near top
        threshold: [0, 1.0]
      }
    );
    headings.forEach((h) => observerRef.current?.observe(h));
    return () => {
      observerRef.current?.disconnect();
    };
  }, [tree]);

  if (!tree || tree.length === 0) return null;

  return (
    <div className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer">
      {tree.map((node) => {
        const HeadingTag = `${node.element}` as keyof JSX.IntrinsicElements;
        return (
          <div key={node.id}>
            <HeadingTag id={node.id} className="group flex max-w-fit  scroll-m-[calc(var(--manual-head-height)+20px)] items-center gap-2">
              <a
                href={`#${node.id}`}
                id={node.id}
                className="not-prose flex  scroll-m-[calc(var(--manual-head-height)+20px)] items-center  no-underline"
              >
                {node.text}
              </a>

              <CopyButton title={node.text} />
            </HeadingTag>

            {node.contentHtml && node.children.length === 0 && <div className="content" dangerouslySetInnerHTML={{ __html: node.contentHtml }} />}
            {node.children && node.children.length > 0 && (
              <RenderContent tree={node.children} mainContainerRef={mainContainerRef} isScrolling={true} />
            )}
          </div>
        );
      })}
    </div>
  );
};

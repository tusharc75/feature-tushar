import { Close, ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, CircularProgress, IconButton } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import ImageZoomPan from 'src/components/ImageZoomPan';
import { cn } from 'src/constants/helpers';
import useContent from '../hooks/useContent';
import useHeadingNode from '../hooks/useHeadingNode';
import { HeadingNode, Resource, UseUsermanual } from '../types';
import CopyButton from './CopyButton';
import { dispatchHashChangeEvent, NavSidebar } from './NavSidebar';
import { makeSafeId } from '../utils';
import { createPortal } from 'react-dom';

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
                {/* <div className="group flex items-center gap-2">
                  <h2 className="my-7 pb-2 text-[25px] font-bold leading-[1.25] text-gray-500 lg:text-[32px]">{data?.sectionName}</h2>
                  <CopyButton title={data?.sectionName} />
                </div> */}
                <div onClick={handleClick} id="prose-content">
                  <RenderContent data={data} tree={tree} mainContainerRef={mainContainerRef} isScrolling={isScrolling} />
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
  data,
  mainContainerRef,
  isScrolling,
  tree
}: {
  data: Resource;
  tree: HeadingNode[];
  mainContainerRef: React.MutableRefObject<HTMLDivElement>;
  isScrolling: boolean;
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    setTimeout(() => {
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
    }, 300);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [tree]);

  if (!tree || tree.length === 0) return null;
  return (
    <>
      <div
        ref={mainContainerRef}
        className="prose mt-4 max-w-full dark:prose-invert [&_img]:block [&_img]:max-w-full [&_img]:cursor-pointer"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
      {tree.map((node) => (
        <HydrateHeadTags key={node.id} node={node} containerRef={mainContainerRef} />
      ))}
    </>
  );
};

function HydrateHeadTags({ node, containerRef }: { node: HeadingNode; containerRef: React.MutableRefObject<HTMLDivElement> }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    // find heading by tag name and text if id is missing
    let el = containerRef.current.querySelector(`#${node.id}`) as HTMLElement;
    if (!el) {
      // fallback: find by tag name and innerText
      const candidates = containerRef.current.querySelectorAll(node.element as any);
      el = Array.from(candidates).find((c) => c.textContent?.trim() === node.text) as HTMLElement | undefined;
      if (el) el.id = node.id;
    }
    if (el) {
      el.classList.add('flex', 'group', 'gap-2', 'items-center', 'scroll-m-[calc(var(--manual-head-height)+20px)]');
    }
    setTarget(el ?? null);
  }, [containerRef, node]);

  if (!target) return null;

  target.id = node.id;

  return createPortal(
    <>
      <CopyButton title={node.text} />
      {node.children.length > 0 && (
        <div className="ml-4">
          {node.children.map((child) => (
            <HydrateHeadTags key={child.id} node={child} containerRef={containerRef} />
          ))}
        </div>
      )}
    </>,
    target
  );
}

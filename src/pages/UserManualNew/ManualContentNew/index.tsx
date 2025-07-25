import { Accordion, AccordionDetails, AccordionSummary, IconButton } from "@mui/material";
import { Close, ExpandMore } from "@mui/icons-material";
import Markdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { cn } from "src/constants/helpers";
import MarkdownTOC from "src/pages/UserManualNew/hooks/MarkdownTOC";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import ImageZoomPan from "src/components/ImageZoomPan";

export const ManualContentNew = ({ state }) => {
  const { pageData, loading, isMobile } = state;
  const [zoomedImage, setZoomedImage] = useState(null);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!pageData || pageData.length === 0) {
    return <div>Equipt - User Manual</div>;
  }

  const rawContent = pageData[0]?.content || '';

  const content = rawContent.replace(/<[^>]*>/g, '');

  const components = {
    img: ({ node, ...props }) => {
      const isIcon = props.src.includes('icon') || props.alt?.toLowerCase().includes('icon');
      return (
        <img 
          {...props} 
          className={isIcon ? "w-6 h-6 inline-block align-middle" : "max-w-full h-auto mx-auto block cursor-pointer hover:opacity-90 transition-opacity"} 
          alt={props.alt || ''}
          onClick={() => {
            if (!isIcon) {
              setZoomedImage({
                src: props.src,
                alt: props.alt || ''
              });
            }
          }}
        />
      );
    },
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mt-10 mb-6" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="ml-4 mt-8 text-xl font-semibold" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="ml-8 mt-6 text-lg font-medium" {...props} />
    ),
    h4: ({ node, ...props }) => (
      <h4 className="ml-12 mt-4 text-base font-medium" {...props} />
    ),
    h5: ({ node, ...props }) => (
    <h5 className="ml-16 text-base font-medium mt-4 mb-2" {...props} />
    ),
    h6: ({ node, ...props }) => (
      <h6 className="ml-20 text-sm font-medium mt-3 mb-2" {...props} />
    ),
    ul: ({ node, ...props }) => (
      <ul className="ml-8 list-disc" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="ml-8 list-decimal" {...props} />
    ),
    li: ({ node, ...props }) => (
      <li className="mb-2" {...props} />
    ),
    p: ({ node, ...props }) => (
      <p className="mb-4" {...props} />
    ),
  };

  return (
    <div
      className={cn(
        'w-full h-full',
        'bg-[white] dark:bg-[#1b1b1d]'
      )}
    >
      <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
        <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            className="prose dark:prose-invert max-w-none"
            components={components}
          >
            {content}
          </Markdown>
        </div>
        <div className="basis-full px-4 lg:basis-1/4">
          {isMobile ? (
            <Accordion elevation={0} className="!rounded-lg dark:bg-[#242526]">
              <AccordionSummary expandIcon={<ExpandMore />} className="[&.Mui-expanded]:![border-bottom:1px_solid_var(--common-border-color)]">
                On This Page
              </AccordionSummary>
              <AccordionDetails>
                <MarkdownTOC markdown={content} />
              </AccordionDetails>
            </Accordion>
          ) : (
            <MarkdownTOC markdown={content} />
          )}
        </div>
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
  );
};
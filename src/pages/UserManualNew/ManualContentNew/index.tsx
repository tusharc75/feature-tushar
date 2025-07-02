import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import Markdown from 'react-markdown';
import rehypeSlug from 'rehype-slug';
import { cn } from "src/constants/helpers";
import MarkdownTOC from "src/pages/UserManualNew/hooks/MarkdownTOC";

export const ManualContentNew = ({ state }) => {
  const { pageData, loading, isMobile } = state;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!pageData || pageData.length === 0) {
    return <div>Equipt - User Manual</div>;
  }

  const content = pageData[0]?.content || '';

  return (
    <div
      className={cn(
        'w-full h-full',
        'bg-[white] dark:bg-[#1b1b1d]'
      )}
    >
      <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
        <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
          <Markdown rehypePlugins={[rehypeSlug]}>{content}</Markdown>
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
    </div>
  );
};
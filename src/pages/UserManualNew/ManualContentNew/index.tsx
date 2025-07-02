import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import MarkdownTOC from "src/pages/UserManualNew/hooks/MarkdownTOC";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { cn } from "src/constants/helpers";

export const ManualContentNew = ({ state }) => {
  const { pageData, loading, isMobile } = state;

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!pageData || pageData.length === 0) {
    return <div>Equipt - User Manual</div>;
  }

  const content = pageData[0]?.content || '';

  const CrepeEditor = () => {
    useEditor((root) => {
      const crepe = new Crepe({
        root,
        defaultValue: content,
      });
      return crepe;
    }, [content]);

    return <Milkdown />;
  };

  return (
    <div
      className={cn(
        'w-full h-full',
        'bg-[white] dark:bg-[#1b1b1d]'
      )}
    >
      <MilkdownProvider>
        <div className="mx-auto flex w-full flex-grow flex-wrap p-2">
          <div className="basis-full px-4 max-lg:order-2 lg:basis-3/4">
            <CrepeEditor />
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
      </MilkdownProvider>
    </div>
  );
};
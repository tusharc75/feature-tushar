import { useEffect, useState } from 'react';
import { Section } from '../type';

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

export function useAutoTOC(containerSelector = '.manual-content-section', pageData?: Section[]) {
  const [tocData, setTocData] = useState<SectionTOC[]>([]);

  useEffect(() => {
    if (!pageData) return;

    const containers = Array.from(document.querySelectorAll(containerSelector));
    const tocMap = new Map<string, TOCItem[]>();

    containers.forEach(container => {
      const sectionId = container.id;
      const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4'));
      const sectionTOC: TOCItem[] = [];

      const entryStack: TOCItem[] = [];

      headings.forEach(node => {
        const text = node.textContent || '';
        const level = Number(node.tagName[1]);
        const headingId = `${sectionId}-${text.replace(/\s+/g, '-').toLowerCase()}`;
        node.id = headingId;

        const entry: TOCItem = {
          id: headingId,
          text,
          level,
          sectionId,
          children: []
        };

        // Build the hierarchy
        while (entryStack.length > 0 && entryStack[entryStack.length - 1].level >= level) {
          entryStack.pop();
        }

        if (entryStack.length === 0) {
          sectionTOC.push(entry);
        } else {
          entryStack[entryStack.length - 1].children.push(entry);
        }

        entryStack.push(entry);
      });

      tocMap.set(sectionId, sectionTOC);
    });

    // Convert to array for state
    const result: SectionTOC[] = Array.from(tocMap.entries()).map(([sectionId, toc]) => ({
      sectionId,
      toc
    }));

    setTocData(result);
  }, [containerSelector, pageData]);

  return tocData;
}
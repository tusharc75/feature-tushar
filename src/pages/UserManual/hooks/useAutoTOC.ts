import { useEffect, useState } from 'react';
import { Section } from '../type';

export function useAutoTOC(containerSelector = '.manual-content-section', pageData?: Section[]) {
  const [toc, setToc] = useState([]);

  useEffect(() => {
    if (!pageData) return;
    
    const containers = Array.from(document.querySelectorAll(containerSelector));
    const headings = [];
    
    containers.forEach(container => {
      const found = Array.from(container.querySelectorAll('h1, h2, h3, h4'));
      found.forEach(node => {
        const sectionId = container.id;
        const headingId = `${sectionId}-${node.textContent.replace(/\s+/g, '-').toLowerCase()}`;
        node.id = headingId;
        
        headings.push({
          id: headingId,
          text: node.textContent,
          level: Number(node.tagName[1]),
          sectionId: sectionId
        });
      });
    });

    const tocData = [];
    let lastH1, lastH2, lastH3;
    
    headings.forEach(h => {
      const entry = { ...h, children: [] };
      if (h.level === 1) {
        tocData.push(entry);
        lastH1 = entry;
        lastH2 = lastH3 = null;
      } else if (h.level === 2 && lastH1) {
        lastH1.children.push(entry);
        lastH2 = entry;
        lastH3 = null;
      } else if (h.level === 3 && lastH2) {
        lastH2.children.push(entry);
        lastH3 = entry;
      } else if (h.level === 4 && lastH3) {
        lastH3.children.push(entry);
      }
    });

    setToc(tocData);
  }, [containerSelector, pageData]);

  return toc;
}
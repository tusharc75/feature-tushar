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
    let currentH1 = null;
    
    headings.forEach(h => {
      const entry = { ...h, children: [] };
      
      if (h.level === 1) {
        tocData.push(entry);
        currentH1 = entry;
      } else if (h.level >= 2 && h.level <= 4 && currentH1) {
        // All h2, h3, h4 go under the same h1
        currentH1.children.push(entry);
      }
    });

    setToc(tocData);
  }, [containerSelector, pageData]);

  return toc;
}
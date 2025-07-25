import React, { useEffect, useRef, useState } from 'react';
import { cn } from 'src/constants/helpers';

const MarkdownTOC = ({ markdown }) => {
  const [toc, setToc] = useState([]);
  const [activeSlug, setActiveSlug] = useState('');
  const level = 0;
  const activeRef = useRef(null);

  useEffect(() => {
    const lines = markdown.split('\n');
    const headings = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.*)/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const slug = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        headings.push({ level, text, slug });
      }
    });

    setToc(headings);
  }, [markdown]);

  const handleTocClick = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    window.history.replaceState(null, '', `#${slug}`);
    setActiveSlug(slug);
    
    const element = document.getElementById(slug);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const headings = toc.map(h => document.getElementById(h.slug)).filter(Boolean);
      let currentActive = '';
      
      for (const heading of headings) {
        const rect = heading.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight * 0.3) {
          currentActive = heading.id;
          break;
        }
      }

      if (currentActive && currentActive !== activeSlug) {
        setActiveSlug(currentActive);
        window.history.replaceState(null, '', `#${currentActive}`);
      }
    };

    if (window.location.hash) {
      const slug = window.location.hash.substring(1);
      setActiveSlug(slug);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc, activeSlug]);

  return (
    <ul
      className={cn(
        level === 0
          ? 'sticky top-[--manual-head-height] list-none pb-2 pl-8 pr-0 pt-2 lg:[border-left:1px_solid_var(--common-border-color)] min-h-[calc(100vh-1rem)]'
          : 'sticky top-[--manual-head-height] list-none pl-2 pr-0'
      )}
    >
      {toc.map((heading, idx) => {
        const isActive = activeSlug === heading.slug;
        return (
          <li 
            key={idx} 
            className={`toc-item ${isActive ? 'active' : ''}`}
            style={{ marginLeft: `${(heading.level - 2) * 12}px` }}
            ref={isActive ? activeRef : null}
          >
            <a
              href={`#${heading.slug}`}
              onClick={(e) => handleTocClick(heading.slug, e)}
              className={cn(
                'text-[12px] hover:text-[var(--link)]',
                isActive && 'font-bold'
              )}
            >
              {heading.text}
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default MarkdownTOC;
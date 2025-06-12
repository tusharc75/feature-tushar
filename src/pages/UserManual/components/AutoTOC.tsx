import { useEffect, useRef } from 'react';
import { cn } from 'src/constants/helpers';

function TOCList({ items, level = 0 }) {
  const hash = typeof window !== 'undefined' ? window.location.hash.split('#')[1] : '';
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [hash]);

  if (!items || !items.length) return null;
  return (
    <ul
      className={cn(
        level === 0
          ? 'sticky top-[--manual-head-height] list-none pb-2 pl-2 pr-0 pt-2 lg:[border-left:1px_solid_var(--common-border-color)]'
          : 'sticky top-[--manual-head-height] list-none pl-2 pr-0'
      )}
    >
      {items.map((item) => {
        const link = item.id;
        const isActive = hash === link;
        return (
          <li
            key={item.id}
            className={cn(
              level === 0
                ? 'm-2 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100'
                : 'm-1.5 list-none text-[16px] font-normal leading-[1.25] text-gray-500 dark:text-gray-100',
              isActive && 'bg-[var(--common-border-color)]/30 rounded'
            )}
            ref={isActive ? activeRef : null}
          >
            <a
              href={`#${link}`}
              className={cn('text-[12px] hover:text-[var(--link)]', isActive && 'font-bold')}
            >
              {item.text}
            </a>
            {item.children && item.children.length > 0 ? (
              <TOCList items={item.children} level={level + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function AutoTOC({ toc }) {
  if (!toc.length) return null;
  return (
    <nav className="auto-toc" style={{ marginTop: 24 }}>
      <div className="font-bold mb-2 text-gray-500 dark:text-gray-100 text-[16px]">In This Article</div>
      <TOCList items={toc} />
    </nav>
  );
}
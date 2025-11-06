import { useEffect, useState } from 'react';
import { HeadingNode } from '../types';
import { useLocation } from 'react-router-dom';
import { cn } from 'src/constants/helpers';
import { LuText } from 'react-icons/lu';

type SidebarProps = {
  tree: HeadingNode[];
  onClickItem?: (id: string) => void; // optional callback if you want custom scroll
};

const InSvg = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn('size-4 rtl:-scale-x-100', className)} {...props} viewBox="0 0 16 16">
    <path d="m0 0 10 12" className="stroke-gray-200 transition-all duration-300 dark:stroke-gray-700"></path>
  </svg>
);

const OutSvg = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={cn(' size-4 rtl:-scale-x-100', className)} {...props} viewBox="0 0 16 16">
    <path d="M10 0 0 12" className="stroke-gray-200 transition-all duration-300 dark:stroke-gray-700"></path>
  </svg>
);

export const HASH_CHANGE_EVENT = 'CUSTOM_hashChangeEvent';
export type HashChangeEventData = {
  hash: string;
};

export const dispatchHashChangeEvent = (detail: HashChangeEventData) => {
  const hashChangeEvent = new CustomEvent(HASH_CHANGE_EVENT, {
    bubbles: true,
    cancelable: true,
    detail
  });
  document.body.dispatchEvent(hashChangeEvent);
};

const SidebarList = ({
  nodes,
  onClickItem,
  hash,
  setHash,
  isChild = false
}: {
  nodes: HeadingNode[];
  onClickItem?: (id: string) => void;
  hash: string;
  setHash: React.Dispatch<any>;
  isChild?: boolean;
}) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <ul className="ml-2 list-none">
      {nodes.map((node, i) => (
        <li key={node.id} className="relative ">
          <a
            href={`#${node.id}`}
            onClick={(e) => {
              setHash(`#${node.id}`);
              if (onClickItem) {
                e.preventDefault();
                onClickItem(node.id);
              }
            }}
            data-active={hash.substring(1) === node.id}
            className={cn(`relative block text-[12px] hover:text-[var(--link)] level-${node.level} data-[active=true]:text-theme`, 'py-2')}
            style={{ marginLeft: (node.level - 1) * 3 }}
          >
            {node.text}
            <span
              className={cn(
                'absolute -left-2 bottom-0 w-[1px] transition-colors duration-300',
                hash.substring(1) === node.id ? 'bg-theme' : 'bg-gray-200 dark:bg-gray-700',
                i === 0 && isChild ? 'h-[calc(100%-12px)]' : 'h-full'
                // i === nodes.length - 1 && isChild ? 'bottom-[12px] h-[calc(100%-12px)]' : ''
              )}
            />
            {node.children && node.children.length > 0 && (
              <>
                <InSvg className={'absolute -left-2 top-full'} />
              </>
            )}
          </a>
          {node.children && node.children.length > 0 && (
            <>
              <SidebarList nodes={node.children} onClickItem={onClickItem} hash={hash} setHash={setHash} isChild={true} />
              {/* <OutSvg className={'absolute -left-[3px] top-[calc(100%-12px)]'} /> */}
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export const NavSidebar: React.FC<SidebarProps> = ({ tree, onClickItem }) => {
  const location = useLocation();
  const [hash, setHash] = useState<string>(() => location.hash);

  useEffect(() => {
    const handleHashChange = (e: CustomEvent<HashChangeEventData>) => {
      setHash(e.detail.hash);
    };
    window.addEventListener(HASH_CHANGE_EVENT, handleHashChange);
    return () => {
      window.removeEventListener(HASH_CHANGE_EVENT, handleHashChange);
    };
  }, []);
  return (
    <nav className="sidebar sticky top-[--manual-head-height] max-h-[calc(100vh-var(--manual-head-height))] overflow-y-auto border-l p-4">
      <h3 className="sticky top-[-18px] z-10 flex items-center gap-2 bg-[white] py-2 text-sm font-medium dark:bg-[rgb(27,27,29)]">
        <LuText />
        On this page
      </h3>
      <SidebarList nodes={tree} onClickItem={onClickItem} hash={hash} setHash={setHash} />
    </nav>
  );
};

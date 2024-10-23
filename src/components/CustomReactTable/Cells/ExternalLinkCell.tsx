import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const ExternalLinkCell = ({ value, link, endComma = false, startComma = false }) => {
  return (
    <p className="flex items-center justify-between gap-2 text-[13px] font-normal">
      <span className=" min-w-0 truncate">
        {startComma && <span className="hidden">,&nbsp;</span>}
        {value}
        {endComma && <span className="hidden">,&nbsp;</span>}
        <span className="md:sr-only md:hidden">&nbsp;</span>
        <RenderLink link={link} value={value} className="md:sr-only md:hidden" />
      </span>

      <RenderLink link={link} value={value} className="max-md:sr-only max-md:hidden" />
    </p>
  );
};

const RenderLink = ({ link, value, className = '' }) => {
  if (!link) return null;
  return (
    <>
      <Link title={value} to={link} target="_blank" rel="noopener noreferrer" className={`max-h-fit flex-shrink-0 ${className}`}>
        <FiExternalLink size={16} className=" align-baseline text-gray-500 dark:text-gray-300" />
      </Link>
    </>
  );
};

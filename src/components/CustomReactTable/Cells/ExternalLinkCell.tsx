import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export const ExternalLinkCell = ({ value, link }) => {
  return (
    <p className="flex items-center justify-between gap-2 text-[13px] font-normal">
      <span className=" min-w-0 truncate">{value}</span>
      {link && (
        <Link title={value} to={link} target="_blank" rel="noopener noreferrer" className={'max-h-fit flex-shrink-0'}>
          <FiExternalLink size={16} className=" align-baseline text-gray-500 dark:text-gray-300" />
        </Link>
      )}
    </p>
  );
};

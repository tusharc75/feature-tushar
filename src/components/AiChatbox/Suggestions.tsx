import { Button } from '@mui/material';
import { useMemo } from 'react';
import { getPathTitleFromPath } from 'src/components/AiChatbox/utils';

type SuggetionsProps = {
  pathname: string;
  sendMessage: (query: string) => Promise<void>;
};
const Suggestions = ({ pathname, sendMessage }: SuggetionsProps) => {
  const title = useMemo(() => getPathTitleFromPath(pathname), [pathname]);

  if (!title) return null;
  return (
    <div className="flex min-h-full w-fit max-w-[70%]  flex-col justify-end  ">
      <div className="rounded-lg bg-[#F4F4F4]  text-[#777575] dark:bg-[hsla(0deg,0%,37.27%,0.5)]  dark:text-white">
        <h6 className="px-[20px] py-[9px] text-[14px] font-normal [border-bottom:1px_solid_var(--common-border-color)]">What can I help you with?</h6>
        <div className="px-[20px] py-[9px]">
          <Button style={{ color: 'var(--link)' }} onClick={() => sendMessage(`Create ${title}`)}>
            Create {title}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;

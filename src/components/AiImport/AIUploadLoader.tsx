import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BsStars } from 'react-icons/bs';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
import { getRandomNumber } from 'src/components/AiChatbox/utils';
import { cn } from 'src/constants/helpers';

const messages = [
  'Uploading your file...',
  'Analyzing document structure...',
  'Extracting key details...',
  'Mapping data to form fields...',
  'Almost done, finalizing entries...'
];

type AIUploadLoaderProps = {
  isProcessing: boolean;
};

const AIUploadLoader = ({ isProcessing }: AIUploadLoaderProps) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }
    queueMicrotask(() => setVisible(true));

    let i = 0;
    let timeout: NodeJS.Timeout;
    const tick = () => {
      i = Math.min(i + 1, messages.length - 1);
      setIndex(i);
      const delay = getRandomNumber(2000, 3000);
      if (i < messages.length - 1) {
        timeout = setTimeout(tick, delay);
      }
    };

    timeout = setTimeout(tick, getRandomNumber(2000, 3000));

    return () => {
      clearTimeout(timeout);
      setVisible(false);
      setIndex(0);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return createPortal(
    <div
      className={cn(
        'absolute inset-0 z-[1400] flex items-center justify-center transition-all [backdrop-filter:blur(2px)]',
        visible ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div className={cn('min-w-[300px] rounded-xl border bg-[var(--dark-primary,white)] p-4 shadow-md ')}>
        <div className="image mb-4 min-h-[100px]">
          <img src={genieImage} alt="Equipt genie" className="mx-auto block max-h-[100px] text-center" />
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <BsStars className="text-[#ffc107]" />
          <p className="glaring-text text-center text-sm [--text-color:currentcolor]">{messages[index]}</p>
        </div>
        <Skeleton animation={'wave'} variant="text" />
      </div>
    </div>,
    document.body
  );
};

export default AIUploadLoader;

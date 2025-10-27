import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import genieImage from 'src/assets/dashboard_images/sidebar/genie.svg';
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
    const interval = setInterval(() => {
      i = Math.min(i + 1, messages.length - 1); // stop incrementing at last message
      setIndex(i);
    }, 3000);

    return () => {
      clearInterval(interval);
      setVisible(false);
      setIndex(0);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return createPortal(
    <div className="absolute inset-0 z-[1400] flex items-center justify-center [backdrop-filter:blur(2px)]">
      <div
        className={cn(
          'min-w-[300px] rounded-xl border bg-[var(--dark-primary,white)] p-4 shadow-md transition-all',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="image mb-4 min-h-[100px]">
          <img src={genieImage} alt="Equipt genie" className="mx-auto block max-h-[100px] text-center" />
        </div>
        <p className="glaring-text mb-2 text-center text-sm [--text-color:currentcolor]">{messages[index]}</p>
        <Skeleton animation={'wave'} variant="text" />
      </div>
    </div>,
    document.body
  );
};

export default AIUploadLoader;

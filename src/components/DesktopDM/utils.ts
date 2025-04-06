import { useEffect, useState } from 'react';
import { RenderSingleFileProps } from 'src/components/DesktopDM/File/FilePreview';
import { fileUrlCache } from 'src/components/DesktopDM/SendMessage';

export const useResolveFileUrl = ({
  url,
  getFileUrl,
  hasToDownload,
  shouldDownload
}: {
  url: string;
  hasToDownload: boolean;
  shouldDownload: boolean;
  getFileUrl: RenderSingleFileProps['getFileUrl'];
}) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!shouldDownload && !url) return;
    if (fileUrlCache.has(url)) {
      setSrc(fileUrlCache.get(url) || '');
      return;
    } else {
      if (hasToDownload) {
        getFileUrl(url, (src) => {
          setSrc(src);
          fileUrlCache.set(url, src);
        });
      } else {
        fileUrlCache.set(url, url);
        setSrc(url);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, hasToDownload, shouldDownload]);

  return src;
};

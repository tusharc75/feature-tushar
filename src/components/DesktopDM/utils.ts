import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { AttachedFileType } from 'src/components/DesktopDM/File/FilePreview';

export const fileUrlCache = new Map<string, string>();

export const useResolveFileUrl = ({ url, hasToDownload, shouldDownload }: { url: string; hasToDownload: boolean; shouldDownload: boolean }) => {
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

export const resolveFileUrl = async ({ url, hasToDownload, shouldDownload }: { url: string; hasToDownload: boolean; shouldDownload: boolean }) => {
  if (!shouldDownload && !url) return;
  if (fileUrlCache.has(url)) {
    const src = fileUrlCache.get(url) || '';
    return src;
  } else {
    if (hasToDownload) {
      const resolvedUrl = await getFileUrl(url);
      const src = resolvedUrl;
      fileUrlCache.set(resolvedUrl, src);
      return src;
    } else {
      fileUrlCache.set(url, url);
      return url;
    }
  }
};

export const getFileUrl = async (fileUrl: string, onSuccess?: (url: string) => void) => {
  try {
    if (fileUrlCache.has(fileUrl)) {
      const url = fileUrlCache.get(fileUrl);
      onSuccess?.(url);
      return url;
    } else {
      const { data } = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(fileUrl)}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      onSuccess?.(url);
      fileUrlCache.set(fileUrl, url);
      return url;
    }
  } catch (error) {}
};

export const handleDownload = async (file: Partial<AttachedFileType>, hasToDownload: boolean) => {
  let fileDownloadUrl = file.url;
  if (hasToDownload) {
    fileDownloadUrl = await getFileUrl(file.url);
  } else {
    fileDownloadUrl = file.url;
  }
  const anchor = document.createElement('a');
  anchor.href = fileDownloadUrl;
  anchor.setAttribute('download', file.fileName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const deleteAttachmentCache = (url: string) => {
  fileUrlCache.delete(url);
};

import { useEffect } from 'react';
import { useUrlParser } from 'src/components/InfoSidebar/RenderAllInfoButtons/hooks';
import { Inspector } from 'src/components/InfoSidebar/RenderInfoInspector/Inspector';
import { HostMessage, PostMessage } from 'src/components/InfoSidebar/types';
import { handleInsertInfoButtonPreview, handleRemoveInfoButtonFromDom, isInIframe } from 'src/components/InfoSidebar/utils';

const targetOrigin = import.meta.env.DEV ? 'http://localhost:5173' : 'https://uat-admin.equipt.ai';

const handlePostMessage = (data: PostMessage) => {
  window.parent.postMessage(data, targetOrigin);
};

const RenderInfoInspector = () => {
  const parsedUrl = useUrlParser();

  useEffect(() => {
    const fromIframe = isInIframe();
    if (!fromIframe) return;

    handlePostMessage({ type: 'initialized', payload: true });

    const inspector = new Inspector({
      onElementClick: ({ selector, url }) =>
        handlePostMessage({
          type: 'select',
          payload: { targetSelector: selector, url, originalUrl: window.location.href }
        })
    });

    const handleMessageFromHost = (event: MessageEvent<any>) => {
      if (event.origin !== targetOrigin) return;
      const { type, payload } = event.data as HostMessage;
      switch (type) {
        case 'start': {
          inspector.start();
          break;
        }
        case 'stop': {
          inspector.stop();
          break;
        }
        case 'delete': {
          handleRemoveInfoButtonFromDom(payload);
          break;
        }
        case 'add': {
          handleInsertInfoButtonPreview({ ...payload });
          break;
        }
      }
    };

    window.addEventListener('message', handleMessageFromHost);
    return () => {
      window.removeEventListener('message', handleMessageFromHost);
      inspector.destroy();
    };
  }, []);

  useEffect(() => {
    if (parsedUrl) {
      handlePostMessage({ type: 'reportRoute', payload: parsedUrl });
    }
  }, [parsedUrl]);

  return <></>;
};

export default RenderInfoInspector;

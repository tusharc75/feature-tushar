import React, { useEffect } from 'react';
import { Inspector } from 'src/components/InfoSidebar/RenderInfoInspector/Inspector';
import { HostMessage, PostMessage } from 'src/components/InfoSidebar/RenderInfoInspector/types';
import { generateUniqueMongoId, isInIframe } from 'src/components/InfoSidebar/utils';

const targetOrigin = import.meta.env.DEV ? 'http://localhost:5173' : import.meta.env?.VITE_APP_API_URL.replace('/api', '');

const handlePostMessage = (data: PostMessage) => {
  window.parent.postMessage(data, targetOrigin);
};

const RenderInfoInspector = () => {
  useEffect(() => {
    const fromIframe = isInIframe();
    if (!fromIframe) return;

    handlePostMessage({type: 'initialized', payload: true})

    const inspector = new Inspector({
      onElementClick: ({ selector, url }) =>
        handlePostMessage({ type: 'select', payload: { id: generateUniqueMongoId(), targetSelector: selector, url } })
    });

    const handleMessageFromHost = (event: MessageEvent<any>) => {
      if (event.origin !== targetOrigin) return;
      const { type } = event.data as HostMessage;
      console.log(event.data);
      if (type === 'start') {
        inspector.start();
      } else if (type === 'stop') {
        inspector.stop();
      }
    };

    window.addEventListener('message', handleMessageFromHost);
    return () => {
      window.removeEventListener('message', handleMessageFromHost);
      inspector.destroy();
    };
  }, []);

  return <></>;
};

export default RenderInfoInspector;

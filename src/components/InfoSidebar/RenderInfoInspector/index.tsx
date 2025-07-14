import { useEffect, useState } from 'react';
import { useUrlParser } from 'src/components/InfoSidebar/RenderAllInfoButtons/hooks';
import InfoButton from 'src/components/InfoSidebar/RenderAllInfoButtons/InfoButton';
import { Inspector } from 'src/components/InfoSidebar/RenderInfoInspector/Inspector';
import { HostMessage, PostMessage } from 'src/components/InfoSidebar/types';
import { isInIframe, targetOrigin } from 'src/components/InfoSidebar/utils';
import { throttle } from 'src/hooks/useThrottle';

const handlePostMessage = (data: PostMessage) => {
  window.parent.postMessage(data, targetOrigin);
};

const SINGNAL_MAX_COUNT = 100;

const RenderInfoInspector = () => {
  const [resizeSignal, setResizeSignal] = useState(0);
  const parsedUrl = useUrlParser();
  const [data, setData] = useState<Extract<HostMessage, { type: 'update' }>['payload']>();

  useEffect(() => {
    const fromIframe = isInIframe();
    if (!fromIframe) return;

    handlePostMessage({ type: 'initialized', payload: true });

    const inspector = new Inspector({
      onElementClick: ({ selector, url }) =>
        handlePostMessage({
          type: 'select',
          payload: { targetSelector: selector, url, originalUrl: `${window.location.pathname}${window.location.search}${window.location.hash}` }
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
        case 'add': {
          setData(payload);
          break;
        }
        case 'update': {
          setData(payload);
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

  useEffect(() => {
    if (!data) return;
    const resizeCallback = throttle(() => {
      setResizeSignal((prev) => (prev > SINGNAL_MAX_COUNT ? 0 : prev + 1));
    });
    window.addEventListener('resize', resizeCallback);
    return () => {
      window.removeEventListener('resize', resizeCallback);
    };
  }, [data]);

  if (!data) return null;

  return <InfoButton item={data} key={`${resizeSignal}-${data.insideAnchor}${data.autoPosition}`} />;
};

export default RenderInfoInspector;

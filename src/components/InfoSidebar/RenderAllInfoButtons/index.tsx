import { useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useUrlParser } from 'src/components/InfoSidebar/RenderAllInfoButtons/hooks';
import InfoButton from 'src/components/InfoSidebar/RenderAllInfoButtons/InfoButton';
import { Action, ApiFormData, HostMessage } from 'src/components/InfoSidebar/types';
import { isInIframe, targetOrigin } from 'src/components/InfoSidebar/utils';
import { throttle } from 'src/hooks/useThrottle';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const callback = (
  mutationList: MutationRecord[],
  observer: MutationObserver,
  onChildChange: (mutationList: MutationRecord[], observer: MutationObserver) => void
) => {
  for (const mutation of mutationList) {
    if (mutation.type === 'childList') {
      onChildChange(mutationList, observer);
    }
  }
};

const SINGNAL_MAX_COUNT = 100;

const RenderAllInfoButtons = () => {
  const {
    state: { user }
  }: any = useData();
  const parsedUrl = useUrlParser();
  const toastConfig = useContext(CustomToastContext);
  const [allData, setAllData] = useState<Action[]>([]);
  const [data, setData] = useState<Action[]>([]);
  const [mutationSignal, setMutationSignal] = useState(0);
  const [resizeSignal, setResizeSignal] = useState(0);
  const [deletedIds, setDeletedIds] = useState(new Set<string>());

  useEffect(() => {
    const getAllData = async () => {
      try {
        const {
          data: { data }
        } = await axiosInstance().get<{ data: ApiFormData[] }>(`/resource-information/all`);
        const newData = data.map((d) => d.actions.filter((action) => action.targetSelector)).flat();
        setAllData(newData);
      } catch (error) {
        toastConfig.setToastConfig(error);
      }
    };
    if (user) {
      getAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (allData.length === 0) return;
    const currentUrl = new URL(parsedUrl, window.location.origin);
    const newData = allData.filter((d) => {
      const dataUrl = new URL(d.url, window.location.origin);
      return (dataUrl.pathname === currentUrl.pathname || d.url === parsedUrl) && !deletedIds.has(d._id);
    });
    setData(newData);
  }, [allData, parsedUrl, deletedIds]);

  useEffect(() => {
    const root = document.querySelector('#root');
    if (!root) return;

    const onChildChange = throttle(() => {
      setMutationSignal((prev) => (prev > SINGNAL_MAX_COUNT ? 0 : prev + 1));
    });

    const observer = new MutationObserver((mutationList, observer) => callback(mutationList, observer, onChildChange));
    observer.observe(root, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true // optional: observes deeper levels
    });

    return () => {
      observer.disconnect();
    };
  }, [data]);

  useEffect(() => {
    if (allData.length === 0) return;
    const resizeCallback = throttle(() => {
      setResizeSignal((prev) => (prev > SINGNAL_MAX_COUNT ? 0 : prev + 1));
    });
    window.addEventListener('resize', resizeCallback);
    return () => {
      window.removeEventListener('resize', resizeCallback);
    };
  }, [allData]);

  useEffect(() => {
    const fromIframe = isInIframe();
    if (!fromIframe) return;
    const handleMessageFromHost = (event: MessageEvent<any>) => {
      if (event.origin !== targetOrigin) return;
      const { type, payload } = event.data as HostMessage;
      switch (type) {
        case 'update': {
          setDeletedIds((prev) => new Set([...prev, payload.id]));
          break;
        }
      }
    };
    window.addEventListener('message', handleMessageFromHost);
    return () => {
      window.removeEventListener('message', handleMessageFromHost);
    };
  }, []);

  return <RenderButtons data={data} key={`${mutationSignal}-${resizeSignal}`} />;
};

const RenderButtons = ({ data }: { data: Action[] }) => {
  return <>{data?.map((d) => <InfoButton item={d} />)}</>;
};

export default RenderAllInfoButtons;

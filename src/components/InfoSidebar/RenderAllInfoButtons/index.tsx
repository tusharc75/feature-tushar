import { useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useUrlParser } from 'src/components/InfoSidebar/RenderAllInfoButtons/hooks';
import { useInforSidebar } from 'src/components/InfoSidebar/store';
import { Action, ApiFormData } from 'src/components/InfoSidebar/types';
import { handleInsertInfoButtonPreview } from 'src/components/InfoSidebar/utils';
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

const RenderAllInfoButtons = () => {
  const {
    state: { user }
  }: any = useData();
  const parsedUrl = useUrlParser();
  const toastConfig = useContext(CustomToastContext);
  const [allData, setAllData] = useState<Action[]>([]);
  const data = useMemo(() => allData.filter((d) => d.url === parsedUrl), [parsedUrl, allData]);
  const [changedSignal, setChangedSignal] = useState(0);
  const [, setStore] = useInforSidebar((state) => state.data);

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
  }, [user]);

  useEffect(() => {
    const root = document.querySelector('#root');
    if (!root) return;

    const onChildChange = throttle(() => {
      setChangedSignal((prev) => (prev > 10 ? 0 : prev + 1));
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
  //

  useEffect(() => {
    const handleInsert = () => {
      for (const d of data) {
        handleInsertInfoButtonPreview({ ...d, id: d._id, onClick: () => setStore({ item: d }), tooltip: d.tooltip });
      }
    };
    if (data.length > 0) {
      handleInsert();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changedSignal, data]);

  return null; // cleaner than empty fragment for no rendering
};

export default RenderAllInfoButtons;

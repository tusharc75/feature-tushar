import { uniqBy } from 'lodash';
import { WalkmeData } from 'src/components/CustomIntro';
import { useStore, WALK_ME_INSTANCE, WALK_ME_STEPS } from 'src/StateProvider/fastContext';

export const useSetWalkmeData = () => {
  const [data, setWalkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);

  const addWalkmeData = (stepData: WalkmeData[]) => {
    const uniqueData = uniqBy([...data, ...stepData], function (d) {
      return `${d.name}_${d.url}`;
    });
    setWalkMeSteps({
      [WALK_ME_STEPS]: uniqueData
    });
  };

  const setWalkmeData = (stepData: WalkmeData[]) => {
    setWalkMeSteps({
      [WALK_ME_STEPS]: stepData
    });
  };

  const removeWalkemeByfilterFunction = (filterFunction: (d: WalkmeData) => boolean) => {
    setWalkMeSteps({ [WALK_ME_STEPS]: data.filter(filterFunction) });
  };

  return { data, setWalkmeData, addWalkmeData, removeWalkemeByfilterFunction };
};

export const useGetWalkmeInstance = () => {
  const [data] = useStore((store) => store[WALK_ME_INSTANCE]);
  return data;
};

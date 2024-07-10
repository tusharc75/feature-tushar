import { uniqBy } from 'lodash';
import { WalkmeData } from 'src/components/CustomIntro';
import { useStore, WALK_ME_STEPS } from 'src/StateProvider/fastContext';

export const useSetWalkmeData = () => {
  const [data, setWalkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);

  const addWalkmeData = (stepData: WalkmeData[]) => {
    const uniqueData = uniqBy([...data, ...stepData], function (d) {
      return `${d.name}_${d.urls.join('_')}`;
    });
    setWalkMeSteps({
      [WALK_ME_STEPS]: uniqueData
    });
  };

  const removeWalkmeDataByName = (names: string | string[]) => {
    if (typeof names === 'string') names = [names];
    setWalkMeSteps({ [WALK_ME_STEPS]: data.filter((d) => !names.includes(d.name)) });
  };

  return { data, addWalkmeData, removeWalkmeDataByName };
};

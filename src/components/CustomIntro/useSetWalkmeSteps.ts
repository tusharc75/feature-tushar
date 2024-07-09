import { WalkmeData } from 'src/components/CustomIntro';
import { useStore, WALK_ME_STEPS } from 'src/StateProvider/fastContext';

export const useSetWalkmeData = () => {
  const [data, setWalkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);

  const addWalkmeData = (stepData: WalkmeData[]) => {
    setWalkMeSteps({
      [WALK_ME_STEPS]: [...data, ...stepData].filter((d) => {
        const newDataName = `${d.name}_${d.urls.join('_')}`;
        const olDataNameList = data.map((d) => `${d.name}_${d.urls.join('_')}`);
        const existInOldData = olDataNameList.some((d) => d === newDataName);
        return !existInOldData;
      })
    });
  };

  const removeWalkmeDataByName = (name: string) => {
    setWalkMeSteps({ [WALK_ME_STEPS]: data.filter((d) => d.name !== name) });
  };

  return { data, addWalkmeData, removeWalkmeDataByName };
};

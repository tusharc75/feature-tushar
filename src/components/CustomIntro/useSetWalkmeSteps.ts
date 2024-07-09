import { WalkmeData } from 'src/components/CustomIntro';
import { useStore, WALK_ME_STEPS } from 'src/StateProvider/fastContext';

export const useSetWalkmeData = () => {
  const [data, setWalkMeSteps] = useStore((store) => store[WALK_ME_STEPS]);

  const setWalkmeData = (stepData: WalkmeData[]) => {
    setWalkMeSteps({
      [WALK_ME_STEPS]: stepData
    });
  };

  return { data, setWalkmeData };
};

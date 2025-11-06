import { useEffect, useState } from 'react';
import { createHeadingHierarchy } from 'src/pages/UserManual/utils';
import { HeadingNode, Resource } from '../types';

const useHeadingNode = (data: Resource) => {
  const [tree, setTreeData] = useState<HeadingNode[]>();

  useEffect(() => {
    const tree = createHeadingHierarchy(data?.content!);
    setTreeData(tree);
  }, [data]);

  return { tree };
};

export default useHeadingNode;

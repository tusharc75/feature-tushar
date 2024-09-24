import { useCallback } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { Item } from 'src/pages/Home/types';
import { USER_FAVOURITES, useStore } from 'src/StateProvider/fastContext';

const useFavorites = () => {
  const [favorites, setFavourites] = useStore((store) => store[USER_FAVOURITES]);

  const handleGetFavourites = useCallback(async () => {
    const api = '/user/user-favourite-resources';
    try {
      const {
        data: { data }
      } = await axiosInstance().get(api);
      const favData: { [key: string]: boolean } = {};
      data[0]?.resources?.forEach((d: string) => {
        favData[d] = true;
      });
      setFavourites({ [USER_FAVOURITES]: favData });
    } catch (error) {
      console.error(error);
    }
  }, [setFavourites]);

  const handleSetFavourite = useCallback(
    async (item: Item) => {
      setFavourites({ [USER_FAVOURITES]: { ...favorites, [item.resourceId]: !favorites[item.resourceId] } });
      try {
        await axiosInstance().put('/user/user-favourite-resources', {
          resource: item.resourceId,
          setFavourite: !favorites[item.resourceId]
        });
        handleGetFavourites();
      } catch (error) {
        console.log(error);
      }
    },
    [favorites, handleGetFavourites, setFavourites]
  );

  return { favorites: favorites, handleGetFavourites, handleSetFavourite };
};

export default useFavorites;

import { IconButton } from '@material-ui/core';
import { Star, StarOutline, StarRate } from '@material-ui/icons';
import { useFavourites } from 'src/hooks';
import { Item } from 'src/pages/Home/types';

const UserFavouriteIcon = ({ item }: { item: Item }) => {
  const { favourites, handleSetFavourite } = useFavourites();

  return (
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        handleSetFavourite(item);
      }}
      size="small"
    >
      {favourites?.[item.resourceId] ? <Star className="mr-0" /> : <StarOutline className="mr-0" />}
    </IconButton>
  );
};

export default UserFavouriteIcon;

import React, { memo, useState } from 'react';
import CarouselDialog from 'src/components/CarouselDialog';

const MultiImageCellImpl = ({ images }: { images: string[] }) => {
  const [dialogData, setDialogData] = useState<{ index: number; open: boolean; images: string[] } | null>(null);

  return (
    <>
      <span className="link" onClick={() => setDialogData({ index: 0, images: images, open: true })}>
        View
      </span>
      {dialogData && dialogData.open && <CarouselDialog index={dialogData.index} close={() => setDialogData(null)} images={dialogData.images} />}
    </>
  );
};

export const MultiImageCell = memo(MultiImageCellImpl);

import React, { useState } from 'react';
import CarouselDialog from 'src/components/CarouselDialog';

export const MultiImageCell = ({ images }: { images: string[] }) => {
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

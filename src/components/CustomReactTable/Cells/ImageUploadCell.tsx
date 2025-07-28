import { Image } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import React, { useState } from 'react';
import CarouselDialog from 'src/components/CarouselDialog';
import { cn } from 'src/constants/helpers';

const ImageUploadCell = ({ field, original }) => {
  const [dialogData, setDialogData] = useState<any>(null);
  return (
    <>
      <div>
        <Avatar
          className={cn('grid-avatar min-[769px]:mx-auto', original?.[field?.fieldName] ? 'cursor-pointer' : '')}
          onClick={() => {
            if (!original?.[field?.fieldName]) return;
            setDialogData({ index: 0, open: true, title: field.fieldLabel, images: [original?.[field?.fieldName]] });
          }}
          src={original?.[field?.fieldName]}
        >
          <Image style={{ fontSize: 18 }} />
        </Avatar>
      </div>

      {dialogData && dialogData.open && (
        <CarouselDialog index={dialogData.index} {...dialogData} close={() => setDialogData(null)} images={dialogData.images} />
      )}
    </>
  );
};

export default ImageUploadCell;

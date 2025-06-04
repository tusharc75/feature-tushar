import Grid from '@mui/material/Grid2';
import { sidebarResource } from 'src/constants/helpers';

const CardView = ({ resource, data, clickOnCard }) => {

  return (
    <Grid container spacing={4}>
      {data?.map((item) => {
        let fieldLabel = 'Pad Name'
        let fieldData = item?.padName
        if (resource === sidebarResource?.wellMaster) {
          fieldLabel = 'Well Name'
          fieldData = item?.wellName
        } else if (resource === sidebarResource?.serializedAsset) {
          fieldLabel = 'Asset Number'
          fieldData = item?.assetNumber
        }
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} style={{ border: '1px solid black' }} key={item?._id}>
            <div className='p-2 flex flex-column gap-1 cursor-pointer' onClick={() => {
              clickOnCard(item)
            }}>
              <div className='flex gap-2'>
                <p>{fieldLabel}:</p>
                <p>{fieldData}</p>
              </div>
            </div>
          </Grid>
        )
      })}
    </Grid>
  )

}

export default CardView;

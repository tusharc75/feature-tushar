import Grid from '@mui/material/Grid2';
import ManageProfile from './ManageProfile';

export default function Sidebar({ onItemClick, activeLink, userData, onFetchUserData, otherDetails, ...rest }) {

  return (
    // <Grid container justifyContent="center">
    <Grid size={{ sm: 12, lg: 12, md: 12 }}>
      <ManageProfile displayUserProfileImage={true} userData={userData} onFetchUserData={onFetchUserData} otherDetails={otherDetails} />
    </Grid>
    // </Grid>
  );
}

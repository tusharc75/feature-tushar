import Grid from '@mui/material/Grid2';
import ManageProfile from './ManageProfile';
import { Box } from '@mui/material';

const MyProfile = ({ userData, onFetchUserData, otherDetails, proxyBy, userFields, loading, userLoading }) => {
  return (<Box>
    <Grid container spacing={3}>
      <Grid size={{ sm: 12, md: 4, lg: 3 }}>
        <ManageProfile
          displayUserProfileImage={true}
          userData={userData}
          onFetchUserData={onFetchUserData}
          otherDetails={otherDetails}
        />
      </Grid>
      <Grid size={{ sm: 12, md: 8, lg: 9 }} className="bgbox">
        <ManageProfile
          displayUserDetails={true}
          userFields={userFields}
          userData={userData}
          userProxy={proxyBy}
          loading={loading}
          userLoading={userLoading}
          onFetchUserData={onFetchUserData}
          otherDetails={otherDetails}
        />
      </Grid>
    </Grid>
  </Box>
  )
}

export default MyProfile;

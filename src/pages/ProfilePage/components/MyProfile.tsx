import ProfileSidebar from './../components/ProfileSidebar';
import Grid from '@mui/material/Grid2';
import ManageProfile from './../components/ManageProfile';

const MyProfile = ({ handleItemClick, activeItem, userData, onFetchUserData, otherDetails, proxyBy, userFields, loading, userLoading }) => {
  return (
    <>
      <Grid>
        <ProfileSidebar
          onItemClick={handleItemClick}
          activeLink={activeItem}
          userData={userData}
          onFetchUserData={onFetchUserData}
          otherDetails={otherDetails}
        />
      </Grid>
      <Grid>
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
    </>
  )
}

export default MyProfile;

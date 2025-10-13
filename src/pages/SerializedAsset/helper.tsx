
export const statusChangePermissionsAllowed = (user, statusChangePermissions, fromStatus, toStatus): boolean => {
    const selectedUserRole = user?.role?.selectedEntity.rolesIds;
    const policyCheck = statusChangePermissions?.filter((ele) => ele.roles?.some((e) => selectedUserRole.includes(e)))
    if (policyCheck?.length) {
        return policyCheck?.some((ele) => fromStatus.every((e) => ele.from_status?.includes(e)) && ele.to_status?.includes(toStatus));
    }
    else {
        return true;
    }
};

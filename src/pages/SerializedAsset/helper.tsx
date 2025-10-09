
export const statusChangePermissionsAllowed = (user, statusChangePermissions, fromStatus, toStatus): boolean => {

    const selectedUserRole = user?.role?.selectedEntity.rolesIds;

    return statusChangePermissions?.some((ele) => ele.roles?.some((r) => selectedUserRole.flat().includes(r)) &&
        fromStatus.every((e) => ele.from_status?.includes(e)) && ele.to_status?.includes(toStatus)
    );
};

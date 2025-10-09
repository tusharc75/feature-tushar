type StatusCheckParams = {
    status: string;
    user: any;
    statusChangePermissions: any;
    selectedRecords?: any[];
    assetDetails?: any;
};

export const statusChangePermissionsAllowed = ({
    status,
    user,
    statusChangePermissions,
    selectedRecords = [],
    assetDetails
}: StatusCheckParams): boolean => {
    const selectedUserRole = user?.role?.selectedEntity.rolesIds;

    const records = selectedRecords.length ? selectedRecords : assetDetails ? [assetDetails] : [];

    if (!records.length || !statusChangePermissions?.length) return false;

    return statusChangePermissions.some((p) =>
        p.roles?.some((r) => selectedUserRole.flat().includes(r)) &&
        records.every((rec) => p.from_status?.includes(rec.status)) &&
        p.to_status?.includes(status)
    );
};

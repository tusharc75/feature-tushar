import React, { useContext, useState } from 'react'
import { CustomOfflineContext } from '../StateProvider/OfflineContext/OfflineContext';

export default function HideWhenOffline({ children }) {
    const { isOffline } = useContext(CustomOfflineContext)
    return !isOffline ? children : ""
}

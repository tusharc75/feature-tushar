import React, { useContext, useState } from 'react'
import { CustomOfflineContext } from '../StateProvider/OfflineContext/OfflineContext';

export default function HideWhenOffline({ children }) {

    const { isOffline } = useContext(CustomOfflineContext)

    // window.addEventListener('online', function (e) {
    //     setIsOnline(true)
    // });

    // window.addEventListener('offline', function (e) {
    //     setIsOnline(false)
    // });

    return !isOffline ? children : ""
}

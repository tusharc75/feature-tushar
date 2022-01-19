import React, { useState, useEffect } from 'react'

export default function useDebounce(next, ms) {

    const [value, setValue] = useState(next)

    useEffect(() => {

        const id = setTimeout(() => setValue(next), ms);
        return () => clearTimeout(id);

    }, [next, ms])

    return value;
}

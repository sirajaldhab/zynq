import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
/**
 * Persist a piece of state into the URL query string.
 * Works with string/number/boolean; values are stored as strings.
 * Removes the param when equal to the provided default to keep URLs clean.
 */
export function useQueryParam(key, defaultValue) {
    const navigate = useNavigate();
    const location = useLocation();
    const initial = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const raw = params.get(key);
        if (raw == null)
            return defaultValue;
        if (typeof defaultValue === 'number') {
            const n = Number(raw);
            return (Number.isFinite(n) ? n : defaultValue);
        }
        if (typeof defaultValue === 'boolean') {
            return (raw === 'true');
        }
        return raw;
    }, [location.search, key]);
    const [value, setValue] = useState(initial);
    // Keep state in sync if the user navigates with back/forward
    useEffect(() => {
        setValue(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initial]);
    const update = useCallback((next) => {
        setValue(next);
        const params = new URLSearchParams(location.search);
        const shouldRemove = next === defaultValue;
        if (shouldRemove)
            params.delete(key);
        else
            params.set(key, String(next));
        navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
    }, [defaultValue, key, location.pathname, location.search, navigate]);
    return [value, update];
}

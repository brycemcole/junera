// components/SearchParamsHandler.js
"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Handles synchronization between URL search parameters and component state.
 *
 * @param {Object} props
 * @param {Function} props.setTitle - Function to update the title state.
 * @param {Function} props.setExperienceLevel - Function to update the experience level state.
 * @param {Function} props.setLocation - Function to update the location state.
 * @param {Function} props.setCompany - Function to update the company state.
 * @param {Function} props.setCurrentPage - Function to update the current page state.
 */
export default function SearchParamsHandler({
    setTitle,
    setExperienceLevel,
    setLocation,
    setCompany,
    setSaved,
    setCurrentPage,
}) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const params = Object.fromEntries([...searchParams]);

        setTitle(params.title || "");
        setExperienceLevel(params.explevel || "");
        setLocation(params.location || "");
        setCompany(params.company || "");
        setSaved(params.saved === 'true');
        setCurrentPage(parseInt(params.page, 10) || 1);
    }, [
        searchParams,
        setTitle,
        setExperienceLevel,
        setLocation,
        setCompany,
        setSaved,
        setCurrentPage,
    ]);

    return null; // This component doesn't render anything visible
}

SearchParamsHandler.propTypes = {
    setTitle: PropTypes.func.isRequired,
    setExperienceLevel: PropTypes.func.isRequired,
    setLocation: PropTypes.func.isRequired,
    setCompany: PropTypes.func.isRequired,
    setSaved: PropTypes.func.isRequired,
    setCurrentPage: PropTypes.func.isRequired,  
};

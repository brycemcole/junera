import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const SearchParamsHandler = ({ 
  setTitle, 
  setExperienceLevel, 
  setLocation, 
  setCompany, 
  setSaved, 
  setCurrentPage,
  setKeywords
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      const params = new URLSearchParams(window.location.search);
      if (searchTerm) {
        params.set('keywords', searchTerm);
      } else {
        params.delete('keywords');
      }
      params.set('page', '1');
      router.push(`/job-postings?${params.toString()}`);
    }, 800),
    [router]
  );

  useEffect(() => {
    // Get all params from URL
    const title = searchParams.get('title') || '';
    const explevel = searchParams.get('explevel') || '';
    const location = searchParams.get('location') || '';
    const company = searchParams.get('company') || '';
    const saved = searchParams.get('saved') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const keywords = searchParams.get('keywords') || '';

    setTitle(title);
    setExperienceLevel(explevel);
    setLocation(location);
    setCompany(company);
    setSaved(saved);
    setCurrentPage(page);
    setKeywords(keywords);

    // If keywords change, trigger debounced search
    if (keywords) {
      debouncedSearch(keywords);
    }
  }, [
    searchParams,
    setTitle,
    setExperienceLevel,
    setLocation,
    setCompany,
    setSaved,
    setCurrentPage,
    setKeywords,
    debouncedSearch
  ]);

  // Clean up debounced function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return null;
};

export default SearchParamsHandler;

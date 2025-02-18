export async function generateMetadata(props) {
  // Get searchParams from the props object correctly
  const searchParams = props.searchParams || {};
  const { title, location, company, experienceLevel } = searchParams;
  
  let metaTitle = 'Job Postings';
  let metaDescription = 'Browse and search through thousands of jobs.';

  // Build dynamic meta title and description
  if (title || location || company || experienceLevel) {
    metaTitle = [
      title && `${title} Jobs`,
      location && `in ${location}`,
      company && `at ${company}`,
      experienceLevel && `(${experienceLevel})`,
      'junera'
    ].filter(Boolean).join(' | ');

    metaDescription = `Find ${title || 'jobs'} ${location ? 'in ' + location : ''} ${company ? 'at ' + company : ''} ${experienceLevel ? 'for ' + experienceLevel + ' level' : ''}. Browse through our curated job listings and apply today!`;
  }

  return {
    metadataBase: new URL('https://junera.us'),
    title: metaTitle,
    description: metaDescription,
    applicationName: 'Junera Jobs',
    keywords: [
      'jobs', 'careers', 'employment', 'job search',
      ...(title ? [title, `${title} jobs`, `${title} career`] : []),
      ...(location ? [location, `jobs in ${location}`, `careers in ${location}`] : []),
      ...(company ? [`${company} jobs`, `${company} careers`] : []),
      ...(experienceLevel ? [`${experienceLevel} jobs`, `${experienceLevel} positions`] : [])
    ].join(','),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: '/job-postings',
      type: 'website',
      siteName: 'Junera Jobs',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
    },
    alternates: {
      canonical: '/job-postings'
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      nocache: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    }
  };
}

export default function Layout({ children }) {
  return children;
}

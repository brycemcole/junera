export async function generateMetadata(props) {
  // Next.js 13+ provides searchParams at the root
  const searchParams = props?.searchParams || {};
  const { title, location, company, explevel } = searchParams;

  let metaTitle = 'Job Postings';
  let metaDescription = 'Browse and search through job postings.';

  if (title || location || company || explevel) {
    metaTitle = [
      title && `${title} Jobs`,
      location && `in ${location}`,
      company && `at ${company}`,
      explevel && `(${explevel})`,
      'junera'
    ].filter(Boolean).join(' | ');

    metaDescription = `Find ${title || ''} jobs ${location ? 'in ' + location : ''} ${company ? 'at ' + company : ''} ${explevel ? 'for ' + explevel + ' level' : ''}. Browse through our curated job listings and apply today!`;
  }

  return {
    metadataBase: new URL('https://junera.us'),
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: '/job-postings',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: '/job-postings',
    }
  };
}

export default function Layout({ children }) {
  return children;
}
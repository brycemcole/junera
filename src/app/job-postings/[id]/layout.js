const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Fallback to the current host if NEXT_PUBLIC_API_URL is not set
  return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
};

export async function generateMetadata(props) {
  const { id } = props.params || {};
  const apiUrl = getApiUrl();

  if (!id) {
    return {
      metadataBase: new URL('https://junera.us'),
      title: 'Job Post Not Found | junera',
      description: 'The requested job posting could not be found.',
    };
  }

  try {
    const response = await fetch(`${apiUrl}/api/job-postings/${id}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job posting');
    }

    const data = await response.json();

    if (!data.success) {
      return {
        metadataBase: new URL('https://junera.us'),
        title: 'Job Post Not Found | junera',
        description: 'The requested job posting could not be found.',
      };
    }

    const jobPosting = data.data;

    const metadata = {
      metadataBase: new URL('https://junera.us'),
      title: `${jobPosting.title} ${jobPosting.location ? `in ${jobPosting.location}` : ''} ${jobPosting.company ? `at ${jobPosting.company}` : ''} | junera jobs`,
      description: `Find ${jobPosting.title || ''} jobs ${jobPosting.location ? 'in ' + jobPosting.location : ''} ${jobPosting.company ? 'at ' + jobPosting.company : ''}. Browse through job listings and apply today!`,
      openGraph: {
        title: `${jobPosting.title} ${jobPosting.location ? `in ${jobPosting.location}` : ''} ${jobPosting.company ? `at ${jobPosting.company}` : ''} | junera jobs`,
        description: `Find ${jobPosting.title || ''} jobs ${jobPosting.location ? 'in ' + jobPosting.location : ''} ${jobPosting.company ? 'at ' + jobPosting.company : ''}. Browse through job listings and apply today!`,
        url: `/job-postings/${id}`,
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: `/job-postings/${id}`,
      }
    };

    // Only add schema if we have the required fields
    if (jobPosting.title && jobPosting.description) {
      metadata.schema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `/job-postings/${id}`
        },
        "title": jobPosting.title,
        "description": jobPosting.description,
        "datePosted": jobPosting.created_at,
        "validThrough": jobPosting.valid_through || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressRegion": jobPosting.location || "Multiple Locations"
          }
        },
        ...(jobPosting.company && {
          "hiringOrganization": {
            "@type": "Organization",
            "name": jobPosting.company
          }
        }),
        "employmentType": jobPosting.experienceLevel ? jobPosting.experienceLevel.toUpperCase() : "FULL_TIME",
        ...(jobPosting.salary_range_str && {
          "baseSalary": {
            "@type": "MonetaryAmount",
            "currency": "USD",
            "value": {
              "@type": "QuantitativeValue",
              "value": jobPosting.salary_range_str
            }
          }
        }),
        ...(jobPosting.location?.toLowerCase().includes('remote') && {
          "applicantLocationRequirements": {
            "@type": "Country",
            "name": "Remote"
          }
        })
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error fetching job posting for metadata:', error);
    return {
      metadataBase: new URL('https://junera.us'),
      title: 'Job Posting | junera',
      description: 'View job posting details and apply.',
    };
  }
}

export default function Layout({ children }) {
  return children;
}
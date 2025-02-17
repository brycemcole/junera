const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
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
    const cleanTitle = jobPosting.title.replace(/[^\w\s-]/g, '');
    const cleanCompany = jobPosting.company ? jobPosting.company.replace(/[^\w\s-]/g, '') : '';
    const cleanLocation = jobPosting.location ? jobPosting.location.replace(/[^\w\s-]/g, '') : '';

    const metadata = {
      metadataBase: new URL('https://junera.us'),
      title: `${cleanTitle} ${cleanLocation ? `in ${cleanLocation}` : ''} ${cleanCompany ? `at ${cleanCompany}` : ''} | junera jobs`,
      description: `Apply now for ${cleanTitle} position ${cleanLocation ? 'in ' + cleanLocation : ''} ${cleanCompany ? 'at ' + cleanCompany : ''}. ${jobPosting.summary || 'View job details and apply today!'}`,
      openGraph: {
        title: `${cleanTitle} ${cleanLocation ? `in ${cleanLocation}` : ''} ${cleanCompany ? `at ${cleanCompany}` : ''}`,
        description: `Apply now for ${cleanTitle} position ${cleanLocation ? 'in ' + cleanLocation : ''} ${cleanCompany ? 'at ' + cleanCompany : ''}. ${jobPosting.summary || 'View job details and apply today!'}`,
        url: `/job-postings/${id}`,
        type: 'website',
        siteName: 'Junera Jobs',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cleanTitle} ${cleanCompany ? `at ${cleanCompany}` : ''}`,
        description: `Apply now for ${cleanTitle} position ${cleanLocation ? 'in ' + cleanLocation : ''}.`,
      },
      robots: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
        googleBot: {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
          'max-video-preview': -1,
        },
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
          "@id": `https://junera.us/job-postings/${id}`
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
            "name": jobPosting.company,
            "logo": jobPosting.company ? `https://logo.clearbit.com/${jobPosting.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : null
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
        "identifier": {
          "@type": "PropertyValue",
          "name": "Junera",
          "value": id
        },
        ...(jobPosting.location?.toLowerCase().includes('remote') && {
          "applicantLocationRequirements": {
            "@type": "Country",
            "name": "Remote"
          },
          "jobLocationType": "TELECOMMUTE"
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
  return (
    <div>
              <script
          crossOrigin="anonymous"
          src="//unpkg.com/react-scan/dist/auto.global.js"
        />
      {children}
    </div>
  )
}
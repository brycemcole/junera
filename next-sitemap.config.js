/** @type {import('next-sitemap').IConfig} */
const { query, end } = require('./src/lib/pgdb');

module.exports = {
  siteUrl: 'https://junera.us',
  generateRobotsTxt: false, // We're managing robots.txt manually
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: [
    '/login*',
    '/register*', 
    '/profile*', 
    '/dashboard*',
    '/notifications*',
    '/api*'
  ],
  generateIndexSitemap: true,
  additionalPaths: async (config) => {
    try {
      const jobsPromise = query(`
        SELECT job_id, created_at as last_modified
        FROM jobPostings 
        WHERE created_at > NOW() - INTERVAL '30 days'
        ORDER BY created_at DESC
      `);

      const companiesPromise = query(`
        SELECT DISTINCT company, 
               MAX(created_at) as last_modified
        FROM jobPostings
        WHERE created_at > NOW() - INTERVAL '30 days'
        GROUP BY company
      `);

      const [jobs, companies] = await Promise.all([jobsPromise, companiesPromise]);

      const paths = [];

      // Format date to valid W3C format
      const formatDate = (date) => {
        if (!date) return new Date().toISOString();
        return new Date(date).toISOString();
      };

      // Add job posting paths
      jobs.rows.forEach((job) => {
        paths.push({
          loc: `/job-postings/${job.job_id}`,
          lastmod: formatDate(job.last_modified),
          changefreq: 'daily',
          priority: 0.9
        });
      });

      // Add company paths
      companies.rows.forEach((company) => {
        paths.push({
          loc: `/companies/${encodeURIComponent(company.company)}`,
          lastmod: formatDate(company.last_modified),
          changefreq: 'daily',
          priority: 0.8
        });
      });

      // Close database connection
      await end();

      return paths;
    } catch (error) {
      console.error('Error generating sitemap paths:', error);
      // Make sure to close the connection even if there's an error
      await end();
      return [];
    }
  },
  transform: async (config, path) => {
    // Custom priority for different types of pages
    let priority = 0.7;
    let changefreq = 'daily';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'always';
    } else if (path.startsWith('/job-postings/')) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.startsWith('/companies/')) {
      priority = 0.8;
      changefreq = 'daily';
    } else if (path === '/job-postings') {
      priority = 0.95;
      changefreq = 'always';
    }

    // Ensure valid date format for lastmod
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString()
    }
  },
}
import request from 'supertest';
import { createServer } from 'http';
import { POST } from './route';
import { getConnection } from '@/lib/db';

// ...existing code...

jest.mock('@/lib/db');

const app = createServer((req, res) => {
  if (req.method === 'POST') {
    POST(req).then(response => {
      res.statusCode = response.status;
      response.json().then(data => res.end(JSON.stringify(data)));
    });
  } else {
    res.statusCode = 404;
    res.end();
  }
});

describe('POST /api/job-postings/create', () => {
  beforeEach(() => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
      execute: jest.fn()
    };
    getConnection.mockResolvedValue({
      request: () => mockRequest
    });
  });

  it('should insert a job posting successfully', async () => {
    getConnection().request().query.mockResolvedValue({
      recordset: [{ id: 1 }]
    });
    getConnection().request().execute.mockResolvedValue({
      output: { JobId: 123 }
    });

    const response = await request(app)
      .post('/api/job-postings/create')
      .send({
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'New York',
        description: 'Job description here',
        source_url: 'http://example.com/job'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('jobId', 123);
  });

  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/job-postings/create')
      .send({
        title: 'Software Engineer',
        company: 'Tech Corp'
        // Missing location, description, source_url
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Missing required fields');
  });

  it('should return 400 if company is not found', async () => {
    getConnection().request().query.mockResolvedValue({
      recordset: []
    });

    const response = await request(app)
      .post('/api/job-postings/create')
      .send({
        title: 'Software Engineer',
        company: 'Unknown Corp',
        location: 'New York',
        description: 'Job description here',
        source_url: 'http://example.com/job'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Company not found');
  });

  it('should handle duplicate requests', async () => {
    getConnection().request().query.mockResolvedValue({
      recordset: [{ id: 1 }]
    });
    getConnection().request().execute.mockResolvedValue({
      output: { JobId: 123 }
    });

    const jobData = {
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'New York',
      description: 'Job description here',
      source_url: 'http://example.com/job'
    };

    // First request
    const firstResponse = await request(app)
      .post('/api/job-postings/create')
      .send(jobData);

    expect(firstResponse.status).toBe(201);

    // Duplicate request
    const secondResponse = await request(app)
      .post('/api/job-postings/create')
      .send(jobData);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body).toHaveProperty('success', true);
    expect(secondResponse.body).toHaveProperty('jobId', 123);
  });

  it('should return 500 on internal server error', async () => {
    getConnection.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .post('/api/job-postings/create')
      .send({
        title: 'Software Engineer',
        company: 'Tech Corp',
        location: 'New York',
        description: 'Job description here',
        source_url: 'http://example.com/job'
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Failed to create job posting');
  });
});
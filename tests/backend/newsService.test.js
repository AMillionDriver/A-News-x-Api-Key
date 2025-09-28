'use strict';

process.env.GNEWS_API_KEY = process.env.GNEWS_API_KEY || 'unit-test-key';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const { fetchNews, clearNewsCache } = require('../../dist/services/newsService');
const { appConfig } = require('../../dist/config/env');

describe('fetchNews', () => {
  let mock;
  const sampleResponse = {
    totalArticles: 2,
    articles: [
      {
        title: 'Berita Teknologi 1',
        description: 'Deskripsi berita 1',
        url: 'https://example.com/1',
        image: 'https://example.com/1.png',
        publishedAt: new Date().toISOString(),
        source: { name: 'Example Source' },
      },
      {
        title: 'Berita Teknologi 2',
        description: 'Deskripsi berita 2',
        url: 'https://example.com/2',
        image: 'https://example.com/2.png',
        publishedAt: new Date().toISOString(),
        source: { name: 'Example Source' },
      },
    ],
  };

  beforeEach(() => {
    mock = new MockAdapter(axios);
    clearNewsCache();
    appConfig.gnews.apiKey = 'unit-test-key';
  });

  afterEach(() => {
    mock.restore();
  });

  it('sanitizes query parameters and returns uncached response', async () => {
    mock.onGet(`${appConfig.gnews.baseUrl}/search`).reply((config) => {
      assert.equal(config.params.q, 'berita');
      assert.equal(config.params.topic, 'technology');
      assert.equal(config.params.page, 1);
      assert.equal(config.params.max, appConfig.defaultPageSize);
      assert.equal(config.params.sortby, 'publishedAt');
      assert.ok(!('from' in config.params));
      assert.ok(!('to' in config.params));
      return [200, sampleResponse];
    });

    const result = await fetchNews({
      query: '   ',
      category: ' Technology ',
      page: -5,
      pageSize: 0,
      sortBy: 'unknown',
      timeRange: 'invalid',
    });

    assert.equal(result.totalArticles, sampleResponse.totalArticles);
    assert.deepEqual(result.articles, sampleResponse.articles);
    assert.equal(result.cached, false);
    assert.equal(result.sortBy, 'publishedAt');
    assert.equal(result.timeRange, 'all');
  });

  it('returns cached response on subsequent calls', async () => {
    let requestCount = 0;
    mock.onGet(`${appConfig.gnews.baseUrl}/search`).reply(() => {
      requestCount += 1;
      return [200, sampleResponse];
    });

    const first = await fetchNews({
      query: 'Teknologi',
      category: 'technology',
      page: 2,
      pageSize: 5,
      sortBy: 'relevance',
      timeRange: 'all',
    });

    assert.equal(first.cached, false);
    assert.equal(requestCount, 1);

    const second = await fetchNews({
      query: 'Teknologi',
      category: 'technology',
      page: 2,
      pageSize: 5,
      sortBy: 'relevance',
      timeRange: 'all',
    });

    assert.equal(second.cached, true);
    assert.equal(requestCount, 1);
  });

  it('applies time range filters when provided', async () => {
    mock.onGet(`${appConfig.gnews.baseUrl}/search`).reply((config) => {
      assert.equal(config.params.sortby, 'publishedAt');
      assert.equal(config.params.q, 'Olahraga');
      assert.ok(typeof config.params.from === 'string');
      assert.ok(typeof config.params.to === 'string');
      const from = Date.parse(config.params.from);
      const to = Date.parse(config.params.to);
      assert.ok(Number.isFinite(from));
      assert.ok(Number.isFinite(to));
      const diffMs = to - from;
      assert.ok(diffMs > 0);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      assert.ok(Math.abs(diffMs - twentyFourHours) < 2000);
      return [200, sampleResponse];
    });

    const result = await fetchNews({
      query: 'Olahraga',
      category: 'sports',
      page: 1,
      pageSize: 10,
      sortBy: 'publishedAt',
      timeRange: '24h',
    });

    assert.equal(result.timeRange, '24h');
  });

  it('converts axios errors to http errors', async () => {
    mock.onGet(`${appConfig.gnews.baseUrl}/search`).reply(429, { message: 'Rate limit' });

    await assert.rejects(
      fetchNews({
        query: 'politik',
        category: 'business',
        page: 1,
        pageSize: 5,
        sortBy: 'popularity',
        timeRange: 'all',
      }),
      (error) => {
        assert.equal(error.status, 429);
        assert.equal(error.message, 'Rate limit');
        return true;
      },
    );
  });

  it('throws helpful error when API key is missing', async () => {
    appConfig.gnews.apiKey = '';

    await assert.rejects(
      fetchNews({
        query: 'ekonomi',
        category: 'business',
        page: 1,
        pageSize: 5,
        sortBy: 'relevance',
        timeRange: 'all',
      }),
      (error) => {
        assert.equal(error.status, 500);
        assert.match(
          error.message,
          /GNEWS_API_KEY/,
        );
        return true;
      },
    );
  });
});

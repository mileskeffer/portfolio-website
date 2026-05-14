import type { APIRoute } from 'astro';
import { getClientPortfolioContent, getPortfolioContent } from '../../lib/portfolio';

export const prerender = true;

export const GET: APIRoute = async () => {
  const portfolio = await getPortfolioContent();

  return new Response(JSON.stringify(getClientPortfolioContent(portfolio), null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
};

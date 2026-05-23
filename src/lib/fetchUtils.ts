/**
 * Custom fetch wrapper with retry logic for network errors
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, backoff = 1000): Promise<Response> {
  try {
    const response = await fetch(url, options);
    // Only retry on specific status codes if desired, but here we mainly care about "Failed to fetch" (network errors)
    // which are caught in the catch block.
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch failed for ${url}, retrying in ${backoff}ms... (${retries} retries left)`, error);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

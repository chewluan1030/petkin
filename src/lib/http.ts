export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}.`);
    }
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const snippet = text.trim().slice(0, 80);
    throw new Error(
      `Unexpected server response (${res.status}): ${snippet || 'non-JSON payload'}`
    );
  }
}

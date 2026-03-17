export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText) as { detail?: unknown };
        if (typeof parsed.detail === "string") {
          errorMessage = parsed.detail;
        } else if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
          errorMessage = JSON.stringify(parsed.detail[0]);
        } else {
          errorMessage = errorText;
        }
      } catch {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

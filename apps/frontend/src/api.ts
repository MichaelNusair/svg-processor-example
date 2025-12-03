import type { Design, DesignListItem } from "@svg-processor/shared-types";
import { API_BASE } from "./constants";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function uploadSVG(
  file: File
): Promise<{ id: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchApi(API_BASE, { method: "POST", body: formData });
}

export async function getDesigns(): Promise<DesignListItem[]> {
  return fetchApi(API_BASE);
}

export async function getDesign(id: string): Promise<Design> {
  return fetchApi(`${API_BASE}/${id}`);
}

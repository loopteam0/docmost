import api from "@/lib/api-client";

export interface IOpenApiSpecFetchResult {
  content: string;
  contentType: string;
}

export async function fetchOpenApiSpec(
  url: string,
  pageId: string,
): Promise<IOpenApiSpecFetchResult> {
  const req = await api.post<IOpenApiSpecFetchResult>("/openapi/fetch-spec", {
    url,
    pageId,
  });
  return req.data;
}

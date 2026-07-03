import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { assertUrlIsFetchable } from '../openapi.utils';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_REDIRECTS = 3;

export interface OpenApiSpecFetchResult {
  content: string;
  contentType: string;
}

@Injectable()
export class OpenApiProxyService {
  private readonly logger = new Logger(OpenApiProxyService.name);

  async fetchSpec(rawUrl: string): Promise<OpenApiSpecFetchResult> {
    let currentUrl = rawUrl;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const url = await this.validateUrl(currentUrl);

      const response = await this.performFetch(url);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          throw new BadRequestException('Unable to fetch the URL');
        }
        currentUrl = new URL(location, url).toString();
        continue;
      }

      if (!response.ok) {
        throw new BadRequestException('Unable to fetch the URL');
      }

      return this.readBody(response);
    }

    throw new BadRequestException('Too many redirects');
  }

  private async validateUrl(rawUrl: string): Promise<URL> {
    try {
      return await assertUrlIsFetchable(rawUrl);
    } catch (err: any) {
      this.logger.warn(`Rejected OpenAPI spec URL: ${rawUrl} — ${err.message}`);
      throw new BadRequestException('Unable to fetch the URL');
    }
  }

  private async performFetch(url: URL): Promise<Response> {
    try {
      return await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { accept: 'application/json, application/yaml, text/yaml, text/plain, */*' },
      });
    } catch (err: any) {
      this.logger.warn(`Failed to fetch OpenAPI spec URL: ${url} — ${err.message}`);
      throw new BadRequestException('Unable to fetch the URL');
    }
  }

  private async readBody(response: Response): Promise<OpenApiSpecFetchResult> {
    const contentType = response.headers.get('content-type') || '';

    if (!response.body) {
      return { content: await response.text(), contentType };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw new BadRequestException('OpenAPI spec is too large');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock?.();
    }

    const content = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString('utf-8');
    return { content, contentType };
  }
}

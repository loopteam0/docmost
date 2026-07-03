import * as dns from 'dns';
import * as ipaddr from 'ipaddr.js';

/**
 * Returns true if the given IP address is anything other than a public
 * unicast address (loopback, private, link-local, multicast, reserved, etc).
 * Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses.
 */
export function isDisallowedIp(ip: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(ip);
  } catch {
    return true;
  }

  const range = addr.range();
  return range !== 'unicast';
}

/**
 * Resolves a hostname to all of its IPv4/IPv6 addresses and returns them.
 * Throws if the hostname cannot be resolved.
 */
export async function resolveHostAddresses(hostname: string): Promise<string[]> {
  if (ipaddr.isValid(hostname)) {
    return [hostname];
  }

  const records = await dns.promises.lookup(hostname, { all: true });
  return records.map((record) => record.address);
}

/**
 * Validates that a URL is safe to fetch server-side: http/https only, and
 * every address it resolves to is a public, non-internal address.
 * Throws an Error with a generic message on any violation.
 */
export async function assertUrlIsFetchable(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (hostname.toLowerCase() === 'localhost') {
    throw new Error('Unable to fetch the URL');
  }

  let addresses: string[];
  try {
    addresses = await resolveHostAddresses(hostname);
  } catch {
    throw new Error('Unable to resolve the URL');
  }

  if (addresses.length === 0 || addresses.some((addr) => isDisallowedIp(addr))) {
    throw new Error('Unable to fetch the URL');
  }

  return url;
}

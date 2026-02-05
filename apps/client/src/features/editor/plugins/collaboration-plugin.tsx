import { Extension } from "@tiptap/core";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
  onStatusParameters,
  onSyncedParameters,
} from "@hocuspocus/provider";
import { collabExtensions } from "@/features/editor/extensions/extensions";
import { CollaborationConfig } from "./types";
import { getCollaborationUrl } from "@/lib/config";
import { jwtDecode } from "jwt-decode";

/**
 * Collaboration providers for Y.js sync
 */
export interface CollaborationProviders {
  ydoc: Y.Doc;
  local: IndexeddbPersistence;
  remote: HocuspocusProvider;
  socket: HocuspocusProviderWebsocket;
}

/**
 * Collaboration plugin state
 */
export interface CollaborationState {
  providers: CollaborationProviders | null;
  isLocalSynced: boolean;
  isRemoteSynced: boolean;
  connectionStatus: string;
}

/**
 * Creates collaboration providers for Y.js/Hocuspocus
 */
export function createCollaborationProviders(
  config: CollaborationConfig,
  callbacks: {
    onLocalSynced: () => void;
    onRemoteSynced: (synced: boolean) => void;
    onConnectionStatus: (status: string) => void;
    onAuthenticationFailed: () => void;
  },
): CollaborationProviders {
  const { documentName, token } = config;
  const collaborationURL = config.url || getCollaborationUrl();

  // Create Y.js document
  const ydoc = new Y.Doc();

  // Create IndexedDB persistence for local storage
  const local = new IndexeddbPersistence(documentName, ydoc);

  // Create WebSocket provider
  const socket = new HocuspocusProviderWebsocket({
    url: collaborationURL,
  });

  // Create Hocuspocus provider
  const remote = new HocuspocusProvider({
    websocketProvider: socket,
    name: documentName,
    document: ydoc,
    token,
    onAuthenticationFailed: callbacks.onAuthenticationFailed,
    onStatus: (event: onStatusParameters) => {
      callbacks.onConnectionStatus(event.status);
    },
    onSynced: (event: onSyncedParameters) => {
      callbacks.onRemoteSynced(event.state);
    },
  });

  // Setup local sync handler
  local.on("synced", callbacks.onLocalSynced);

  return {
    ydoc,
    local,
    remote,
    socket,
  };
}

/**
 * Destroys collaboration providers and cleans up resources
 */
export function destroyCollaborationProviders(
  providers: CollaborationProviders | null,
) {
  if (!providers) return;

  providers.socket.destroy();
  providers.remote.destroy();
  providers.local.destroy();
}

/**
 * Handles authentication failure by refreshing token
 */
export async function handleAuthenticationFailure(
  providers: CollaborationProviders,
  currentToken: string,
  refetchToken: () => Promise<{ data?: { token: string } }>,
): Promise<void> {
  const payload: any = jwtDecode(currentToken);
  const now = Date.now().valueOf() / 1000;
  const isTokenExpired = now >= payload.exp;

  if (isTokenExpired) {
    const result = await refetchToken();
    if (result.data?.token) {
      providers.socket.disconnect();
      setTimeout(() => {
        providers.remote.configuration.token = result.data.token;
        providers.socket.connect();
      }, 100);
    }
  }
}

/**
 * Creates collaboration extensions for the editor
 */
export function createCollaborationExtensions(
  provider: HocuspocusProvider,
  config: CollaborationConfig,
): Extension[] {
  return collabExtensions(provider, config.user);
}

/**
 * Manages idle-based connection control
 */
export function shouldDisconnect(
  isIdle: boolean,
  documentHidden: boolean,
  isConnected: boolean,
): boolean {
  return isIdle && documentHidden && isConnected;
}

export function shouldReconnect(
  documentVisible: boolean,
  isDisconnected: boolean,
): boolean {
  return documentVisible && isDisconnected;
}

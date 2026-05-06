import {
  ApiKeys,
  Attachments,
  AuthAccounts,
  AuthProviders,
  Backlinks,
  Billing,
  Comments,
  FileTasks,
  Groups,
  GroupUsers,
  PageHistory,
  Pages,
  Shares,
  SpaceMembers,
  Spaces,
  SpaceTemplates,
  SpaceTemplatePages,
  UserMfa,
  Users,
  UserTokens,
  WorkspaceInvitations,
  Workspaces,
} from '@docmost/db/types/db';
import { PageEmbeddings } from '@docmost/db/types/embeddings.types';

export interface DbInterface {
  attachments: Attachments;
  authAccounts: AuthAccounts;
  authProviders: AuthProviders;
  backlinks: Backlinks;
  billing: Billing;
  comments: Comments;
  fileTasks: FileTasks;
  groups: Groups;
  groupUsers: GroupUsers;
  pageEmbeddings: PageEmbeddings;
  pageHistory: PageHistory;
  pages: Pages;
  shares: Shares;
  spaceMembers: SpaceMembers;
  spaces: Spaces;
  spaceTemplates: SpaceTemplates;
  spaceTemplatePages: SpaceTemplatePages;
  userMfa: UserMfa;
  users: Users;
  userTokens: UserTokens;
  workspaceInvitations: WorkspaceInvitations;
  workspaces: Workspaces;
  apiKeys: ApiKeys;
}

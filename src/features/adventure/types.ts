export type AdventureMessageRole = 'user' | 'narrator' | 'system';

export type AdventureMessage = {
  id: string;
  role: AdventureMessageRole;
  content: string;
  authorName?: string;
  authorId?: string;
  relatedMessageId?: string;
};

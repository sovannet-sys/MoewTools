export type ToolId = 'home' | 'unlockpdf' | 'compresspdf' | 'mergepdf' | 'pdftopng' | 'json' | 'password';

export type ToolCategory = 'all' | 'dev' | 'security' | 'pdf';

export interface ToolDefinition {
  id: ToolId;
  name: string;
  shortDesc: string;
  category: 'dev' | 'security' | 'pdf';
  categoryLabel: string;
  tags: string[];
}

export type CompressionTier = 'low' | 'medium' | 'high';

export interface ToastMessage {
  id: number;
  message: string;
  isError?: boolean;
}

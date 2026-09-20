export type ToolId =
  | 'home'
  | 'unlockpdf'
  | 'compresspdf'
  | 'mergepdf'
  | 'pdftopng'
  | 'imgtopdf'
  | 'json'
  | 'password';

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

export type AppLanguage = 'en' | 'km';

export interface ToastMessage {
  id: number;
  message: string;
  isError?: boolean;
}

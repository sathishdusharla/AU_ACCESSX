// Global window extension for MetaMask
export interface Window {
  ethereum?: any;
}

export interface SessionData {
  sessionId: string;
  nonce: string;
  title: string;
  date: string;
}

export interface AttendanceRequest {
  email: string;
  sessionId: string;
  nonce: string;
  signature: string;
  walletAddress: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

export interface ValidatorResponse {
  verified: boolean;
  tokenId?: string;
  metadata?: NFTMetadata;
  error?: string;
}

export interface Receipt {
  id: string;
  user: string;
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  imageUrl?: string;
  status: 'en_revision' | 'aceptada' | 'rechazada';
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptCreate {
  companyName: string;
  folioNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  image?: File;
}

export interface ReceiptUpdate {
  companyName?: string;
  folioNumber?: string;
  date?: string;
  description?: string;
  totalAmount?: number;
}

export interface ReceiptStatusUpdate {
  status: 'en_revision' | 'aceptada' | 'rechazada';
}

export interface ReceiptStats {
  totalReceipts: number;
  enRevision: number;
  aceptadas: number;
  rechazadas: number;
  totalAmount: number;
}

export interface ReceiptsResponse {
  success: boolean;
  count: number;
  data: Receipt[];
}

export interface ReceiptResponse {
  success: boolean;
  data: Receipt;
}

export interface ReceiptStatsResponse {
  success: boolean;
  data: ReceiptStats;
}

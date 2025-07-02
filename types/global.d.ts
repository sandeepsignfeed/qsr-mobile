export {};

declare global {
  interface Window {
    electronAPI: {
      generateInvoice: (data: {
        orderDetails: any;
        phone: string;
        companyInfo: any;
      }) => Promise<{ success: boolean; downloadLink?: string; message?: string }>;
    };
  }
}

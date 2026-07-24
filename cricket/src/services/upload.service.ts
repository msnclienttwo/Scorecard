import { api } from './api';

interface UploadResponse {
  url: string;
  publicId: string;
}

export class UploadService {
  private static getBaseUrl(): string {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    );
  }

  private static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('scorebolt-token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  static async uploadImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.getBaseUrl()}/api/upload`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  static async uploadMultiple(files: File[]): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.getBaseUrl()}/api/upload/multiple`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  static async deleteImage(publicId: string): Promise<void> {
    await api.delete(`/api/upload/${encodeURIComponent(publicId)}`);
  }
}

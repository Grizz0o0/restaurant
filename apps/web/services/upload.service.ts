import { toast } from 'sonner';
import { getAccessToken } from '@/lib/auth/cookies';

interface UploadResponse {
    url: string;
    public_id: string;
}

export const uploadService = {
    upload: async (
        file: File,
        folder: string = 'general',
    ): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Use the local Next.js proxy route instead of direct backend URL
            // This allows the server-side proxy to access httpOnly cookies
            const response = await fetch(`/api/upload?folder=${folder}`, {
                method: 'POST',
                // No need to manually set Authorization header, cookies are sent automatically
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();
            // Handle cases where the backend wraps the response in a 'data' property
            return data.data || data;
        } catch (error: any) {
            console.error('Upload error:', error);
            throw error;
        }
    },
};

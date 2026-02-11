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

        const token = getAccessToken();
        const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052/v1/api';

        try {
            const response = await fetch(`${apiUrl}/uploads?folder=${folder}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();
            console.log('Upload Service Response Data:', data); // Debug log
            return data.data || data; // Handle wrapped response
        } catch (error: any) {
            console.error('Upload error:', error);
            throw error;
        }
    },
};

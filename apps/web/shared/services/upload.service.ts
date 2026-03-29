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
            const response = await fetch(`/api/upload?folder=${folder}`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();
            return data.data || data;
        } catch (error: unknown) {
            console.error('Upload error:', error);
            throw error;
        }
    },
};

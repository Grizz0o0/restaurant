import { Injectable } from '@nestjs/common'
import { UploadApiResponse, UploadApiErrorResponse, v2 as cloudinary } from 'cloudinary'
import * as streamifier from 'streamifier'

@Injectable()
export class CloudinaryService {
  uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    const isAvatar = folder.includes('avatar')
    const resizeWidth = isAvatar ? 400 : 1024

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `restaurant-app/${folder}`,
          transformation: [
            { width: resizeWidth, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(new Error(error.message))
          resolve(result!)
        },
      )

      streamifier.createReadStream(file.buffer).pipe(uploadStream)
    })
  }
}

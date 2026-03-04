import { NextRequest } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { errorResponse } from '@/lib/errors';

cloudinary.config({
    cloud_name: 'dhyspcm2x',
    api_key: '912372597985941',
    api_secret: 'loIZq69ys-GjLgNMjGIvYp2TBsk'
});

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const uploadResponse = await cloudinary.uploader.upload(dataUri, {
            folder: 'lexora_assets',
            resource_type: 'auto'
        });

        return Response.json({
            url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id,
            resource_type: uploadResponse.resource_type
        });
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return errorResponse(error);
    }
}

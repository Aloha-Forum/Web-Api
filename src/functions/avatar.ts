import { BlobServiceClient } from '@azure/storage-blob';
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from '../shared/Status';
import { get } from 'http';
import { getUidBySession } from '../utils/user';

async function handleAvatar(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = request.headers.get('authorization');
        if (accessToken == null) return ErrorResponse(Status.BAD_REQUEST);

        const uid = await getUidBySession(accessToken);
        if (uid == null) return ErrorResponse(Status.UNAUTHORIZED);

        const formData = await request.formData();
        const file = formData.get('avatar');
        
        if (!file || !(file instanceof File)) {
            return ErrorResponse(Status.BAD_REQUEST);
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.StorageAccount);
        const containerClient = blobServiceClient.getContainerClient('avatars');
        await containerClient.createIfNotExists();

        const blockBlobClient = containerClient.getBlockBlobClient(uid as string);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await blockBlobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: file.type }
        });

        return { status: 201, body: JSON.stringify({ blobUrl: blockBlobClient.url }) };
    } catch (error) {
        return { status: 500, body: JSON.stringify({ message: error.message }) };
    }
}

app.http('avatar', {
    methods: ['POST'],
    route: '/api/avatar',
    handler: handleAvatar
});
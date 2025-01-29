import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { getParams } from "../utils/validate";
import { ResourceNotFoundError } from "../shared/ErrorResponse";

async function recommnedPosts(request: HttpRequest): Promise<HttpResponseInit> {
    try {            
        const page = parseInt(request.query.get('page')) || 0;
        const limit = 10;

        const querySpec = {
            query: 'SELECT c.postId, c.uid, c.title, LEFT(c.body, 50) as body, c.lastActivity, c.popularity \
                    FROM c \
                    ORDER BY c.popularity.viewCount, c.popularity.commentCount, c.postAt DESC \
                    OFFSET @offset \
                    LIMIT @limit',
            parameters: [
                { name: '@offset', value: page*limit },
                { name: '@limit', value: limit }
            ],
        };
        const { resources: items } = await Aloha.Post.items.query(querySpec).fetchAll();

        if (items.length) 
            return { body: JSON.stringify(items) }
        else
            throw new ResourceNotFoundError();
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('recommendPosts', {
    methods: ['GET'],
    route: 'api/recommend',
    handler: recommnedPosts
});
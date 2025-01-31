import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { getParams } from "../utils/validate";
import { ResourceNotFoundError } from "../shared/ErrorResponse";
import { getCommentCount } from "../shared/comment";

async function topicPosts(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const { topicId } = getParams(request.params, ['topicId']);
            
        const page = parseInt(request.query.get('page')) || 0;
        const limit = 10;

        const querySpec = {
            query: 'SELECT c.postId, c.uid, c.title, LEFT(c.body, 50) as body, c.lastActivity, c.popularity \
                    FROM c \
                    WHERE c.topicId = @topicId \
                    ORDER BY c.postAt DESC \
                    OFFSET @offset \
                    LIMIT @limit',
            parameters: [
                { name: '@topicId', value: topicId },
                { name: '@offset', value: page*limit },
                { name: '@limit', value: limit }
            ],
        };
        const { resources: items } = await Aloha.Post.items.query(querySpec).fetchAll();

        for (let item of items) {
            item.commentCount = await getCommentCount(item.postId);
        }

        if (items.length) 
            return { body: JSON.stringify(items) }
        else
            throw new ResourceNotFoundError();
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('topicPosts', {
	methods: ['GET'],
	route: 'api/t/{topicId}',
	handler: topicPosts
});
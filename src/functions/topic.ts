import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";

async function topics(request: HttpRequest): Promise<HttpResponseInit> {
    const page = parseInt(request.query.get('page')) || 0;
    const limit = 10;

    const querySpec = {
        query: 'SELECT c.topicId, c.name, c.description, c.popularity \
                FROM c \
                ORDER BY c.popularity.viewCount DESC, c.popularity.postCount DESC\
                OFFSET @offset \
                LIMIT @limit',
        parameters: [
            { name: '@offset', value: page*limit },
            { name: '@limit', value: limit }
        ],
    };

    try {
        const { resources: items } = await Aloha.Topic.items.query(querySpec).fetchAll();

        for (let item of items) {
            const querySpec = {
                query: 'SELECT TOP 1 c.lastActivity \
                        FROM c \
                        WHERE c.topicId = @topicId \
                        ORDER BY c.postAt DESC',
                parameters: [
                    { name: '@topicId', value: item.topicId }
                ],
            };
            const { resources: [post] } = await Aloha.Post.items.query(querySpec).fetchNext();
            item.lastActivity = post ? post.lastActivity : -1;
        }

        return { body: JSON.stringify(items) };
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('topics', {
	methods: ['GET'],
	route: 'api/t',
	handler: topics
});
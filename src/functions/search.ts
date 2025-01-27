import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";

async function search(request: HttpRequest): Promise<HttpResponseInit> {
    const pattern = request.query.get('pattern');

    const querySpec = {
        query: 'SELECT c.topicId, c.name, c.description, c.popularity \
                FROM c \
                WHERE LOWER(c.name) LIKE LOWER(@pattern) \
                ORDER BY c.popularity.viewCount DESC, c.popularity.postCount DESC \
                OFFSET 0 LIMIT 10',
        parameters: [
            { name: '@pattern', value: `%${pattern}%` },
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
    } catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('search', {
    methods: ['GET'],
    route: 'api/search',
    handler: search
});
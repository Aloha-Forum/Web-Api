import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";

async function topics(request: HttpRequest): Promise<HttpResponseInit> {
    const page = parseInt(request.query.get('page')) || 0;
    const limit = 10;

    const querySpec = {
        query: 'SELECT c.topicId, c.name, c.description \
                FROM c \
                ORDER BY c.topicId \
                OFFSET @offset \
                LIMIT @limit',
        parameters: [
            { name: '@offset', value: page*limit },
            { name: '@limit', value: limit }
        ],
    };

    try {
        const { resources: items } = await Aloha.Topic.items.query(querySpec).fetchAll();
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
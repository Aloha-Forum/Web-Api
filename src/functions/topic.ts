import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getTopicLastActivity, getTopics } from "../stored/topic";

async function topics(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const page = parseInt(request.query.get('page')) || 0;
        const limit = 10;

        const items = await getTopics(page, limit);

        for (let item of items)
            item.lastActivity = await getTopicLastActivity(item.topicId);

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
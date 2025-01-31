import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getTopicLastActivity, searchTopic } from "../stored/topic";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from "../shared/Status";

async function search(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const pattern = request.query.get('pattern');
        if (pattern == null) return ErrorResponse(Status.BAD_REQUEST);

        const items = await searchTopic(pattern);

        for (let item of items)
            item.lastActivity = await getTopicLastActivity(item.topicId);

        return { body: JSON.stringify(items) };
    }
    catch (error) {
        return { status: error.statusCode || 500, body: error.message };
    }
}

app.http('search', {
    methods: ['GET'],
    route: 'api/search',
    handler: search
});
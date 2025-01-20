import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { verifyToken } from "../utils/auth";
import { RequestFormatError, ResourceNotFoundError } from "../shared/error";
import { getUidByEmail } from "../utils/user";

async function isSessionExisted(token: String): Promise<boolean> {

    const querySpec = {
        query: 'SELECT VALUE COUNT(1) \
                FROM c \
                WHERE c.sid = @token',
        parameters: [
            { name: '@token', value: token }
        ],
    };

    const { resources: [count] } = await Aloha.Session.items.query(querySpec).fetchAll();
    return count > 0
}

async function login(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = request.headers.get('authorization');
        if (accessToken == null) throw new RequestFormatError()
        
        const respsonse = await verifyToken(accessToken);
        const user = await getUidByEmail(respsonse.email);
        if (user == null) throw new ResourceNotFoundError()
    
        if (!await isSessionExisted(accessToken)) {
            const session = { uid: user.uid, sid: accessToken, ttl: respsonse.expiresIn}
            await Aloha.Session.items.create(session)
        }
    
        return { status: 202, body: JSON.stringify({uid: user.uid, email: respsonse.email }) }
    }
    catch (error) {
        return { status: error.statusCode || 500 }
    }
}

async function signup(request: HttpRequest): Promise<any> {
    try {
        const accessToken = request.headers.get('authorization');
        if (accessToken == null) throw new RequestFormatError()
        
        const uid = request.query.get('uid');
        if (uid == null) throw new RequestFormatError()
        
        const respsonse = await verifyToken(accessToken);
    
        await Aloha.User.items.create({ uid, email: respsonse.email })
    
        const session = { uid: uid, sid: accessToken, ttl: 3600}
        await Aloha.Session.items.create(session)
    
        return { status: 202, body: JSON.stringify({uid: uid, email: respsonse.email }) }
    }
    catch (error) {
        return { status: error.statusCode || 500 }
    }
}

app.http('signup', {
    methods: ['POST'],
    route: '/signup',
    handler: signup
});

app.http('login', {
    methods: ['POST'],
    route: '/login',
    handler: login
});
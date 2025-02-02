import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { Aloha } from "../shared/container";
import { verifyToken } from "../utils/auth";
import { getUidByEmail } from "../utils/user";
import { ErrorResponse } from "../shared/ErrorResponse";
import { Status } from "../shared/Status";
import { isSessionExisted } from "../stored/auth";

async function login(request: HttpRequest): Promise<HttpResponseInit> {
    try {
        const accessToken = request.headers.get('authorization');
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST)
        
        const respsonse = await verifyToken(accessToken);

        const user = await getUidByEmail(respsonse.email);
        if (!user) return ErrorResponse(Status.NOT_FOUND)
    
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
        if (!accessToken) return ErrorResponse(Status.BAD_REQUEST)
        
        const uid = request.query.get('uid');
        if (!uid) return ErrorResponse(Status.BAD_REQUEST)
        
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
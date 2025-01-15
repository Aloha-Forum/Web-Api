import { app, HttpRequest } from "@azure/functions";
import { Aloha } from "../shared/container";
import { verifyToken } from "../utils/auth";
import { RequestFormatError, ResourceConflictError } from "../shared/error";
import { isAccountExisted } from "../utils/user";

async function signup(request: HttpRequest): Promise<any> {
    try {
        const accessToken = request.headers.get('authorization');
        if (accessToken == null) throw new RequestFormatError()
        
        const uid = request.body['uid']
        if (uid == null) throw new RequestFormatError()

        // check if user id or email exist
        const respsonse = await verifyToken(accessToken);
        if (isAccountExisted(uid, respsonse.email)) throw new ResourceConflictError()
        
        // create a user account
        const user = { email: respsonse.email, uid }
        await Aloha.User.items.create(user)

        // store the access token in the server
        const session = { uid, sid: accessToken, ttl: respsonse.expires_in}
        await Aloha.Session.items.create(session)

        // all steps are work properly
        return { status: 202 };
    } 
    catch (error) {
        return { status: error.statusCode || 500 };
    }
}

app.http('auth', {
    methods: ['POST'],
    route: '/signup',
    handler: signup
});
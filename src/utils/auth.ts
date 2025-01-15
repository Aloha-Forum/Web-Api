import { UndefinedError } from "../shared/error";

// the application supports Google OAuth only
export async function verifyToken(token: string): Promise<any> {
    const googleOAuthUrl = 'https://www.googleapis.com/oauth2/v3/userinfo'
    const queryParams = new URLSearchParams({ "access_token": token })

    const response = await fetch(`${googleOAuthUrl}?${queryParams}`, { method: 'GET'});

    // unsuccessful to verify access token
    if (!response.ok) 
        throw new UndefinedError(response.status);
    
    return await response.json();
}
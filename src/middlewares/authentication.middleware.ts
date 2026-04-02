export default function authenticationMiddleware(req: any, res: any, next: any) {
    // Implement your authentication logic here
    // For example, you can check for a valid token in the request headers
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    //jwt verify token here and get user information from token 
    
    next(); // Proceed to the next middleware or route handler
}   
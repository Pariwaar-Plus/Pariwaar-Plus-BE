
export type LoginProps = {
    email: string;
    password: string;
}

const loginService = (props: LoginProps )=>{
    //login logics here
    return "Successfully logged in!";
}

//get user by email 



export {
    loginService,
}
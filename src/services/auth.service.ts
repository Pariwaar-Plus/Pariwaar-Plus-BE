
export type LoginProps = {
    email: string;
    password: string;
}

const loginService = (props: LoginProps )=>{
    //login logics here
    return "Successfully logged in!";
}


export {
    loginService,
}
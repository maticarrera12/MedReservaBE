import jwt from "jsonwebtoken"

// token de autenticacion de usuario
const authUser = async (req,res,next) => {
// console.log("Token recibido:", req.headers.token);
    try {
        
        const{token} = req.headers
        if (!token) {
            return res.json({success:false,message:'No Autorizado. Ingrese Nuevamente'})
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id
        next()
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

export default authUser



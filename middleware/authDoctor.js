import jwt from "jsonwebtoken"

// token de autenticacion de doctort
const authDoctor = async (req,res,next) => {
// console.log("Token recibido:", req.headers.token);
    try {
        
        const{dtoken} = req.headers
        if (!dtoken) {
            return res.json({success:false,message:'No Autorizado. Ingrese Nuevamente'})
        }
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        req.body.docId = token_decode.id
        next()
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

export default authDoctor


import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  createPaymentPreference,
   verifyPayment,
} from "../controllers/userController.js";
import authUser from "../middleware/authUser.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

// Rutas para el manejo de usuarios
userRouter.post("/registrarse", registerUser);
userRouter.post("/iniciar-sesion", loginUser);
userRouter.get("/get-perfil", authUser, getProfile);
userRouter.post("/actualizar-perfil", upload.single("image"), authUser, updateProfile);
userRouter.post("/tomar-turno", authUser, bookAppointment);
userRouter.get("/turnos", authUser, listAppointments);
userRouter.post("/cancelar-turno", authUser, cancelAppointment);
userRouter.post("/crear-preferencia",authUser, createPaymentPreference);
userRouter.get("/verificar-pago",authUser, verifyPayment);

export default userRouter;

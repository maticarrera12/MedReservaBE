import express from "express"
import {  appointmentCancel, appointmentComplete, appointmentsDoctor, doctorDashboard, doctorList, doctorProfile, loginDoctor, updateDoctorProfile } from "../controllers/doctorController.js"
import authDoctor from "../middleware/authDoctor.js"

const doctorRouter = express.Router()

doctorRouter.get('/lista', doctorList)
doctorRouter.post('/login', loginDoctor)
doctorRouter.get('/turnos', authDoctor, appointmentsDoctor)
doctorRouter.post('/completar-turno', authDoctor, appointmentComplete)
doctorRouter.post('/cancelar-turno', authDoctor, appointmentCancel)
doctorRouter.get('/dashboard',authDoctor, doctorDashboard)
doctorRouter.get('/perfil',authDoctor, doctorProfile)
doctorRouter.post('/actualizar-perfil',authDoctor, updateDoctorProfile)

export default doctorRouter
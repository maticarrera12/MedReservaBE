import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import axios from "axios"
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { locales } from "validator/lib/isIBAN.js";



// API para registrar usuario

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password || !email) {
      return res.json({ success: false, message: "Detalles faltantes" });
    }

    //Validar email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Ingrese un email valido" });
    }

    //Validar contrasena
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Ingrese una contraña mas segura",
      });
    }

    // Hasheo de contrasena
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api para el user login

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "El usuario no existe" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({
        success: false,
        message: "El nombre de usuario o la contrasena son incorrectas",
      });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API para datos del perfil

const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API para actualizar el perfil

const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Detalles Faltantes" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // subir imagen a cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }

    res.json({ success: true, message: "Perfil Actualizado" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Tomar turno

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res.json({ success: false, message: "Doctor No Disponible" });
    }

    let slots_booked = docData.slots_booked;

    // chequear disponiblidad
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: "Turno No Disponible" });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // guardar los turnos en docData
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Has Tomado el turno" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }

  // obtener mis turnos tomados en el frontend
};

const listAppointments = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


  // API pora cancelar turnos

  const cancelAppointment = async (req,res) => {
    try {
      const {userId, appointmentId} = req.body
      const appointmentData = await appointmentModel.findById(appointmentId)

      // verificar turno
      if (appointmentData.userId !== userId) {
        return res.json({success:false, message:'Accion Desautorizada'})
      }

      await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled:true})

      // liberar turno
      const {docId, slotDate, slotTime} = appointmentData
      const doctorData = await doctorModel.findById(docId)

      let slots_booked = doctorData.slots_booked
      slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

      await doctorModel.findByIdAndUpdate(docId, {slots_booked})
      res.json({success:true, message:'Turno Cancelado'})

    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }
  }

  //// API de mercado pago

  const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN }
  );
  const createPaymentPreference = async (req, res) => {
    const { appointmentId } = req.body; // Obtener el id de la cita desde el frontend
  
    try {
      // Buscar la cita en la base de datos
      const appointment = await appointmentModel.findById(appointmentId);
  
      if (!appointment) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
  
      // Configuración de MercadoPago
      const preference = new Preference(client);
  
      // Crear la preferencia con los datos de la cita
      const response = await preference.create({
        body: {
          items: [
            {
              title: `Consulta con ${appointment.docData.name}`, // Título de la consulta
              quantity: 1,
              unit_price: appointment.amount, // Monto de la cita
              currency_id: 'ARS', // Especificar moneda (opcional)
            },
          ],
           payment_methods:{
            excluded_payment_types: [],
            default_payment_method_id: "account_money",
            default_card_id: "4b8f93e462294f6119df42ba642a4cd9",
           },
          back_urls: {
            success: 'http://localhost:5173/success-payment', // URL de éxito
            failure: 'http://localhost:5173/error-payment', // URL de fallo
            pending: 'http://localhost:5173/pago-pendiente', // URL de pendiente
          },
          auto_return: 'approved',
          external_reference: appointment._id
        },
      });
  
      // Mostrar la respuesta completa en la consola
      // console.log("Respuesta completa de la preferencia:", response); // Aquí ves toda la respuesta, incluyendo init_point
  
      // Retornar la URL de pago y preference_id
      res.json({
        init_point: response.init_point, // URL para redirigir al usuario para completar el pago
        preference_id: response.id, // Accede a `id` en vez de `_id`
      });
  
    } catch (error) {
      console.error('Error al crear la preferencia de pago:', error);
      res.status(500).send('Error al crear la preferencia de pago');
    }
  };
  


  const verifyPayment = async (req, res) => {
    const { collection_status, preference_id, external_reference, payment_status } = req.body;
  
    // Verificar que los parámetros necesarios estén presentes
    if (!collection_status || !preference_id || !external_reference) {
      return res.status(400).json({ message: "Faltan parámetros de la respuesta" });
    }
  
    try {
      // Buscar la cita usando el `external_reference` que es el ID de la cita
      const appointment = await appointmentModel.findOne({ _id: external_reference });  // Aquí cambiamos por _id
  
      if (!appointment) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
  
      // Actualizar el estado del pago en la cita
      if (collection_status === "approved") {
        // Si el pago es aprobado
        appointment.payment = true; // Marcar el pago como realizado
        appointment.paymentStatus = "approved"; // Estado de pago aprobado
        appointment.paymentDate = new Date(); // Guardar la fecha del pago
      } else {
        // Si el pago no es aprobado
        appointment.payment = false; // Marcar el pago como no realizado
        appointment.paymentStatus = "failed"; // Estado de pago fallido
        appointment.paymentDate = null; // No hay fecha de pago
        appointment.paymentErrorMessage = `Error de pago: ${payment_status || 'Desconocido'}`; // Mensaje de error
      }
  
      // Actualizar la cita en la base de datos
      await appointment.save();
  
      return res.status(200).json({
        message: `Pago procesado. Estado: ${collection_status}`,
        appointment,
      });
    } catch (error) {
      console.error("Error al verificar el pago:", error);
      return res.status(500).json({ message: "Error al verificar el pago" });
    }
  };
  




export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointments,
  cancelAppointment,
  createPaymentPreference,
  verifyPayment,
};

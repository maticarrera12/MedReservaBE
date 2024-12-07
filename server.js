
// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import connectDB from "./config/mongodb.js";
// import connectCloudinary from "./config/cloudinary.js";
// import adminRouter from "./routes/adminRoute.js";
// import doctorRouter from "./routes/doctorRoute.js";
// import userRouter from "./routes/userRoute.js";

// // Cargar variables de entorno
// dotenv.config();

// // app config
// const app = express();
// const port = process.env.PORT || 4000;

// // Conectar a la base de datos y a Cloudinary de manera asíncrona
// const startServer = async () => {
//   try {
//     await connectDB();
//     await connectCloudinary();

//     // middlewares
//     app.use(express.json());
//     app.use(cors());

//     // api endpoint
//     app.use("/api/admin", adminRouter);
//     app.use("/api/doctor", doctorRouter);
//     app.use("/api/user", userRouter);

//     // Ruta por defecto
//     app.get("/", (req, res) => {
//       res.send("API FUNCIONANDO");
//     });

//     // Iniciar servidor
//     app.listen(port, () => {
//       console.log(`Servidor corriendo en http://localhost:${port}`);
//     });
//   } catch (err) {
//     console.error("Error al iniciar el servidor:", err);
//   }
// };

// startServer();

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import path from "path"; // Importar path

// Cargar variables de entorno
dotenv.config();

// app config
const app = express();
const port = process.env.PORT || 4000;

// Conectar a la base de datos y a Cloudinary de manera asíncrona
const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    // middlewares
    app.use(express.json());
    app.use(cors());

    // api endpoint
    app.use("/api/admin", adminRouter);
    app.use("/api/doctor", doctorRouter);
    app.use("/api/user", userRouter);

    // Servir archivos estáticos del frontend
    if (process.env.NODE_ENV === "production") {
      app.use(express.static(path.join(__dirname, "frontend/build"))); // Ruta de tu carpeta build

      // Ruta por defecto para todas las solicitudes no API (React)
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "build", "index.html"));
      });
    }

    // Ruta por defecto
    app.get("/", (req, res) => {
      res.send("API FUNCIONANDO");
    });

    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Error al iniciar el servidor:", err);
  }
};

startServer();


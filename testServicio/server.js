require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); 
const app = express();

const containerPort = process.env.CONTAINER_PORT;
const hostPort = process.env.HOST_PORT;
const ipAddress = process.env.IP_ADDRESS;
const containerName = process.env.CONTAINER_NAME;


app.use(fileUpload());
app.use(express.static('frontend'));


app.use(cors());


app.use('/output', express.static(path.join(__dirname, 'output')));

app.get("/healthCheck", (req, res) => {
  res.status(200).end();
});

app.post('/upload', async (req, res) => {
  if (!req.files || !req.files.image) {
    console.log("No se subió ninguna imagen");
    return res.status(400).send('No se subió ninguna imagen.');
  }

  const image = req.files.image;
  const watermarkText = 'Marca de agua';

  try {
    console.log("Leyendo la imagen con Jimp");
    const img = await Jimp.read(image.data);
    console.log("Cargando la fuente");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);

    console.log("Añadiendo la marca de agua");
    img.print(font, 10, 10, watermarkText);  
    
    const outputPath = path.join(__dirname, 'output', 'watermarked.jpg');
    console.log("Guardando la imagen en:", outputPath);
    await img.writeAsync(outputPath);  

    console.log("Enviando imagen modificada");
    res.sendFile(outputPath);  
  } catch (err) {
    console.error("Error al procesar la imagen:", err);
    res.status(500).send('Error al procesar la imagen.');
  }
});

const startServer = async () => {
  try {
    console.log('IP del host:', ipAddress);
    console.log('ID del contenedor:', containerName);
    console.log('HostPort:', hostPort);
    console.log("ipDIS:", process.env.DIS_SERVERIP_PORT);
    console.log(`Servidor corriendo en el puerto: ${containerPort}`);

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ipAddress: ipAddress, port: hostPort , id: containerName }),
    };

    await fetch(`http://${process.env.DIS_SERVERIP_PORT}/middleware`, requestOptions)
      .then((response) => {
        console.log(response.status);
      });
  } catch (error) {
    console.error('Error al obtener la IP:', error);
  }
};

app.listen(containerPort, startServer);

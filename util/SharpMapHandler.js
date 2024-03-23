const path = require("path")
const fs = require("fs")
const {createWorker} = require("tesseract.js")
const sharp = require('sharp');

/*
* Receiving the image and trying to remove the thin lines in the background
* */
async function refactorImage(fileName) {
    const worker = await createWorker("eng");
    console.log(fileName.split('/'))

    const sharpOutputPath = fileName.split("/")[0] + "/edited_" + Date.now() + "_" + fileName.split('/')[1];

    const img = await sharp(fileName).resize(512).sharpen().median(5).modulate({
        lightness: 65
    })
        .normalise({
            upper: 60
        })
        .sharpen().toFile(sharpOutputPath);

    const {data: {text}} = await worker.recognize(sharpOutputPath, {rotateAuto: true}, {
        imageColor: true,
        imageGrey: true,
        imageBinary: true
    });
    console.log("-------")
    console.log(text);
    console.log("-------")
    await worker.terminate();
}

refactorImage("mapOutput/map_001013.png")
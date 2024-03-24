const path = require("path")
const fs = require("fs")
const {createWorker} = require("tesseract.js")
const sharp = require('sharp');

/*
* Receiving the image and trying to remove the thin lines in the background
* */
async function refactorImage(fileName) {
    const worker = await createWorker("ams-captcha-model", 1, {
        langPath: (".."),
        gzip: false,
        legacyLang: true,
        logger: m => console.log(m),
        
    });

    await worker.load();
    await worker.loadLanguage('ams-captcha-model');
    await worker.initialize('ams-captcha-model');

    // const sharpOutputPath = "edited_" + Date.now() + "_" + fileName;
    // const output = "D:\\__PROJECTS\\tesstrain\\data\\ams-captcha-model-ground-truth\\new\\" + path.basename(fileName)

    const imagePath = await createImage(fileName);

    console.log("BILDPFAD: ", imagePath)

    const {data: {text}} = await worker.recognize(imagePath, {rotateAuto: true}, {
        imageColor: true,
        imageGrey: true,
        imageBinary: true
    });
    // console.log("-------")
    // console.log(text);
    // console.log("-------")
    await worker.terminate();
    return text
}

// refactorImage("mapOutput/map_001013.")
// testFunction("D:\\__PROJECTS\\tesstrain\\data\\ams-captcha-model-ground-truth")
testFunction("mapOutput/maps/renamed");

async function createImage(originalPath) {
    const result = "mapOutput/edited/" + path.basename(originalPath);
    const img = await sharp(originalPath).resize(512).sharpen().median(5).modulate({
        lightness: 65
    })
        .normalise({
            upper: 60
        })
        .sharpen().toFile(result);

    return result;
}

async function testFunction(directoryPath) {
    const result = [];
    await fs.readdir(directoryPath, async (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        for (const file of files) {
            if (file.endsWith(".png")) {
                let text = await refactorImage(directoryPath + "/" + file);
                console.log("PARSED TEXT: ", text)

                // text = text.replaceAll("\n", "").replaceAll(" ", "").trim()
                // const match = file.split('.')[0] === text;
                // result.push({fileName: file, text: text, match: match})
            }
        }

        console.log("RESULT: ", result);

    });

}
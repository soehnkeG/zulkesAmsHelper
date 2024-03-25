const path = require("path");
const fs = require("fs");
const {createWorker, PSM} = require("tesseract.js");
const sharp = require("sharp");

/*
 * Receiving the image and trying to remove the thin lines in the background
 * */
async function refactorImage(fileName) {
    const worker = await createWorker("eng");
    worker.setParameters(
        {
            tessedit_char_whitelist: '0123456789',
        }
    )

    const sharpOutputPath =
        fileName.split("/")[0] +
        "/edited/" +
        Date.now() +
        "_" +
        fileName.split("/")[1];

    const rectangleWidth = 512;
    const rectangleHeight = 512;


    const rectangle = Buffer.from(
        `<svg width="${rectangleWidth}" height="${rectangleHeight}">
    <rect x="0" y="0" width="${rectangleWidth}" height="${rectangleHeight}" fill="transparent" stroke="black" stroke-width="5"/>
  </svg>`
    );

    // const img = await sharp(fileName)
    //     .resize(512).composite([
    //         {input: rectangle, top: 128, left: 0}
    //     ])
    //     .sharpen({
    //         sigma: 10
    //     })
    //     .median(5)
    //     .modulate({
    //         lightness: 65,
    //     })
    //     .normalise({
    //         upper: 60,
    //     })
    //     .grayscale(true)
    //     .threshold(253)
    //     .toFile(sharpOutputPath);
    const img = await sharp(fileName)
        .resize(512)
        .grayscale(true)
        .threshold(253)
        .toFile(sharpOutputPath);

    console.log(fileName)
    const {
        data: {text},
    } = await worker.recognize(
        sharpOutputPath,
        {
            rotateAuto: true, rotateRadians: 5
        },
    );

    await worker.terminate();
    return text.replaceAll('\n', '');
}

// refactorImage("mapOutput/map_001013.png");
iterateMaps("maps")


async function iterateMaps(directory) {
    await fs.readdir(directory, await async function (err, files) {
        const result = [];

        // Handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        for(let file of files){
            if (file.endsWith('.png')) {
                // Log file path
                const img = path.join(directory, file);
                const text = await refactorImage(img);
                const expectedText = path.basename(file).replace('.png', '')
                const res = text.replaceAll('\n', '');
                result.push({text: text, expected: expectedText});
            }
        }
        console.log(result)

    });

}

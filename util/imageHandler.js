const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const Jimp = require("jimp");
const {getPixelColor} = require("jimp");

/*
 * Receiving the image and trying to remove the thin lines in the background
 * */
async function preprocessImage(fileName) {
    console.log("FILENAME: ", fileName)

    const output = fileName.replace(`captchas/${path.basename(fileName)}`, `preprocessed/${path.basename(fileName)}`)

    console.log("OUTPUT: ", output)

    const rectangleWidth = 512;
    const rectangleHeight = 512;


    const rectangle = Buffer.from(
        `<svg width="${rectangleWidth}" height="${rectangleHeight}">
      <rect x="0" y="0" width="${rectangleWidth}" height="${rectangleHeight}" fill="transparent" stroke="black" stroke-width="5"/>
    </svg>`
    );

    const img = await sharp(fileName)
        .resize(512).composite([
            {input: rectangle, top: 0, left: 0}
        ])
        .sharpen({
            sigma: 10
        })
        .median(10)
        .modulate({
            lightness: 65,
        })
        .normalise({
            upper: 60,
        })
        .threshold(140)
        .toFile(output);

    // const img = await sharp(fileName)
    //     .resize(512)
    //     .grayscale(true)
    //     .threshold(253)
    //     .toFile(output);

    return output;
}


async function segmentImage(fileName) {
    const output = fileName.replace("preprocessed", "segmented");
    let result = [];
    console.log("Segmenting image: ", fileName)
    await Jimp.read(fileName).then(image => {
        const width = image.getWidth();
        const height = image.getHeight();
        let start = 0;
        let segments = [];

        for (let x = 0; x < width; x++) {
            let columnHasPixel = false;
            for (let y = 0; y < height; y++) {
                if (image.getPixelColor(x, y) < 0xFFFFFFFF) {
                    columnHasPixel = true;
                    break;
                }
            }
            if (columnHasPixel) {
                if (start === 0) start = x;
            } else {
                if (start !== 0) {
                    segments.push({s: start, e: x});
                    start = 0;
                }
            }
        }

        segments.forEach((seg, index) => {
            const outPath = output.replace('.png', `_${index}.png`)
            const croppedImage = image.clone().crop(seg.s, 0, seg.e - seg.s, height);
            const segWidth = croppedImage.width;
            console.log("WDITH: ", segWidth)
            const segHeight = croppedImage.height;
            if (segWidth > 6) {
                croppedImage.write(outPath);
                result.push(outPath)
            }
        })
    }).catch(err => {
        console.error(err);
    })
    return result;
}

async function normalizeRotation(imagePath) {
    const output = imagePath.replace('segmented', 'rot_normalized')

    Jimp.read(imagePath).then(image => {
        const size = Math.max(image.getWidth(), image.getHeight());
        return new Jimp(size, size, 0xFFFFFFFF).composite(image, (size - image.getWidth()) / 2, (size - image.getHeight()) / 2)
            .write(output);
    }).catch(err => console.error(err))

    return output;
}


// refactorImage("mapOutput/map_001013.png");

async function iterateMaps(directory) {
    await fs.readdir(directory, await async function (err, files) {
        const result = [];

        // Handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        for (let file of files) {
            if (file.endsWith('.png')) {
                // Log file path
                const img = path.join(directory, file);
                const text = await preprocessImage(img);
                const expectedText = path.basename(file).replace('.png', '')
                const res = text.replaceAll('\n', '');
                result.push({text: text, expected: expectedText});
            }
        }
        console.log(result)

    });

}

module.exports.preprocessImage = preprocessImage;
module.exports.segmentImage = segmentImage;
module.exports.normalizeRotation = normalizeRotation;
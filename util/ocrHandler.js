const {createWorker} = require("tesseract.js");

async function recognize(imagePath) {
    const worker = await createWorker("eng", 2);
    worker.setParameters(
        {
            tessedit_char_whitelist: '0123456789',
        }
    )

    const {
        data: {text},
    } = await worker.recognize(
        imagePath,
        {
            rotateAuto: true, rotateRadians: 5
        },
    );

    await worker.terminate();
    return text.replaceAll('\n', '');
}

module.exports.recognize = recognize;
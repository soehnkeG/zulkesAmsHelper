const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');
const {mapDownloader} = require('mineflayer-item-map-downloader')
const {preprocessImage, segmentImage, normalizeRotation} = require("./util/imageHandler")
const {recognize} = require("./util/ocrHandler");
const {post} = require("axios");
const axios = require("axios");

function loadConfig() {
    try {
        const data = fs.readFileSync('config.json', 'utf8'); // Read the JSON file
        return JSON.parse(data); // Parse the JSON data
    } catch (err) {
        console.error('Error reading config file:', err);
        process.exit(1); // Exit the program on error
    }
}


async function initBot() {
    const config = loadConfig(); // Load configuration from JSON file


    const bot = mineflayer.createBot({
        username: config.username,
        host: config.host,
        port: 25565,
        auth: 'microsoft',
        "mapDownloader-outputDir": "./mapOutput",
        "mapDownloader-saveToFile": true,
        version: "1.12.2"
    });
    bot.loadPlugin(mapDownloader);

    await bot.on("spawn", async () => {
        bot.chat("/home danny");

        const id = bot.registry.blocksByName["beacon"].id

        console.log("Block ID: ", id)
        const ams = bot.findBlock({matching: id, maxDistance: 10, count: 1})

        if (!ams) {
            console.error("no ams found");
            return;
        }

        await bot.activateBlock(ams);

        await bot.on("windowOpen", async (window) => {
            let slots = window.slots;

            const slot = slots.find(s => s != null && s.name === "gold_ingot");

            console.info("FOUND SLOT: ", slot)

            if (!slot) {
                console.error("couldn't find loot-slot")
                return;
            }

            await bot.simpleClick.leftMouse(slot.slot);

            bot.on("new_map_saved", (options) => readMap(options))
        })
    })

    bot.on('end', console.log)
}

testOcrProcess();

function readMap(options) {
    console.log(options.name); //logging file name
    // refactorImage(options.name);
}


async function testOcrProcess() {
    try {
        const apiEndpoint = "http://127.0.0.1:5000/solve"
        const directory = "maps/captchas";

        await fs.readdir(directory, await async function (err, files) {
            const result = [];

            // Handling error
            if (err) {
                return console.log('Unable to scan directory: ' + err);
            }

            // for (let file of files) {
            if (files[17].endsWith('.png')) {
                const img = path.join(directory, files[17]);
                const preprocessedImage = await preprocessImage(img);

                const base64Image = base64_encode(preprocessedImage);

                const response = await axios.post(apiEndpoint, {image: base64Image}, {
                    headers: {
                        "Content-Type": "application/json"
                    }
                })

                // console.log("RESPONSE: ", response)


                // const parsed = await recognize(preprocessedImage)
                // console.log({parsed: parsed, file: files[0]})

                // const segmentedImagePaths = await segmentImage(preprocessedImage);
                // let text = "";
                // for (let sp of segmentedImagePaths) {
                //     // const normalizedRotationPath = await normalizeRotation(sp);
                //
                //     const parsed = await recognize(sp)
                //     if (parsed && (parsed !== "" || parsed !== " ")) {
                //         text += parsed
                //     }
                // }
                // console.log({parsed: text, file: file})

                // const res = text.replaceAll('\n', '');
                // result.push({text: text, expected: expectedText});
            }
            // }

        });

    } catch (e) {
        console.error(e)
    }
}

function base64_encode(file) {
    const bitmap = fs.readFileSync(file);
    const base64Image = Buffer.from(bitmap).toString('base64');
    const dataUri = `data:image/png;base64,${base64Image}`; // Adjust image/png to your image type if needed
    return base64Image;
}
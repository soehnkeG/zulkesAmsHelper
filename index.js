const fs = require('fs');
const path = require('path');
const mineflayer = require('mineflayer');
const {mapDownloader} = require('mineflayer-item-map-downloader')
const {refactorImage} = require("./util/SharpMapHandler")

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


initBot();

function readMap(options) {
    console.log(options.name); //logging file name
    // refactorImage(options.name);
}
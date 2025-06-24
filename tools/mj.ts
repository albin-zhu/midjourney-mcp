import { Midjourney } from "npm:midjourney";
import sharp from "npm:sharp";
import { homedir } from "node:os";

const salaiToken = Deno.env.get("SALAI_TOKEN") || "";
const channelId = Deno.env.get("CHANNEL_ID") || "";
const serverId = Deno.env.get("SERVER_ID") || "";

const mj = new Midjourney({
    ServerId: serverId,
    ChannelId: channelId,
    BotId: "1022952195194359889",
    SalaiToken: salaiToken,
    Debug: true,
    Ws: true,
});

// Alternative safer streaming base64 conversion

async function handleImage(image: string) {
    // 1. download image to local file
    const response = await fetch(image);
    const buffer = await response.arrayBuffer();
    const filePath  = `${homedir()}/Pictures/images/${Date.now()}.webp`;
    Deno.mkdirSync(`${homedir()}/Pictures/images`, { recursive: true });
    await Deno.writeFile(filePath, new Uint8Array(buffer));

    // 2. split image to 4 parts by sharp
    const originalImage = sharp(filePath);
    const originalImageMetadata = await originalImage.metadata();
    const originalImageWidth = originalImageMetadata.width;
    const originalImageHeight = originalImageMetadata.height;

    const h = originalImageHeight / 2;
    const w = originalImageWidth / 2;

    const content = [];
    for (let i = 0; i < 4; i++) {
        const opt = {
            left: (i % 2) * w,
            top: Math.floor(i / 2) * h,
            width: w,
            height: h,
        }
        console.log(`${i} ${opt.left} ${opt.top} ${opt.width} ${opt.height}`);
        const image = (await sharp(filePath).extract(opt).toBuffer()).toString("base64");
        content.push({
            type: "image",
            data: image,
            mimeType: "image/png",
        });
    }

    return content;
}

export async function generateImage(prompt: string) {
    await mj.init();
    const result = await mj.Imagine(prompt, (uri: string, process: string) => {
        console.log(uri, process);
    });

    if (!result) {
        console.log("Failed to generate image");
        return null;
    }

    console.log(result);

    return handleImage(result.proxy_url || result.uri);
}

Deno.test("generateImage", async () => {
    const result = await generateImage("A beautiful girl");
    console.log(result);
});
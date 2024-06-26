const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

module.exports = {
  config: {
    name: "art",
    version: "1.0.0",
    role: 0,
    hasPrefix: true,
    aliases: ["art"],
    description: "Art Image Generator",
    usage: "art <prompt> | <model> | <control>",
    credits: "ST | Sheikh Tamim",//converted by chilli
  },

  run: async function ({ api, event, args }) {
    try {
      if (!event.messageReply) {
        await api.sendMessage("⚠️ | Please reply to an image to use this command.", event.threadID, event.messageID);
        return;
      }

      const repliedMessage = event.messageReply;
      if (!repliedMessage.attachments.length) {
        await api.sendMessage("⚠️ | The replied message does not contain an image.", event.threadID, event.messageID);
        return;
      }

      const imageUrl = repliedMessage.attachments[0].url;

      const commandText = args.join(" ").trim();
      const commandParts = commandText.split("|").map(part => part.trim());

      if (commandParts.length !== 3) {
        await api.sendMessage("⚠️ | Invalid command format. Please use: art <prompt> | <model> | <control>", event.threadID, event.messageID);
        return;
      }

      const prompt = commandParts[0];
      const model = parseInt(commandParts[1]);
      const control = parseInt(commandParts[2]);

      if (isNaN(model) || model < 1 || model > 3) {
        await api.sendMessage("⚠️ | Model number should be between 1 and 3.", event.threadID, event.messageID);
        return;
      }

      if (isNaN(control) || control < 1 || control > 5) {
        await api.sendMessage("⚠️ | Control number should be between 1 and 5.", event.threadID, event.messageID);
        return;
      }

      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

      const formData = new FormData();
      formData.append('model', model);
      formData.append('control', control);
      formData.append('prompt', prompt);
      formData.append('image', Buffer.from(response.data, 'binary'), 'image.jpg');

      const apiResponse = await axios.post('https://beb-anime-convert.onrender.com/generate-image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer'
      });

      const imageBuffer = Buffer.from(apiResponse.data, 'binary');

      const imagePath = path.join(__dirname, 'generated-image.jpg');
      fs.writeFileSync(imagePath, imageBuffer);

      await api.sendMessage({
        attachment: fs.createReadStream(imagePath),
        body: `Generated image based on: ${prompt}`
      }, event.threadID);

      fs.unlinkSync(imagePath);

    } catch (error) {
      console.error('Error processing art command:', error);
      await api.sendMessage("⚠️ | Error processing art command. Please try again later.", event.threadID, event.messageID);
    }
  }
};

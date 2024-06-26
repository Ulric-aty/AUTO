const axios = require('axios');
const fs = require('fs-extra');

module.exports.config = {
  name: "imagen",
  version: "1.0.0",
  role: 0,
  hasPrefix: false,
  credits: "chill",
  description: "Generate image .",
  usages: "imagen [prompt] [model]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;

  if (args.length < 1) {
    return api.sendMessage("Please provide a prompt. Usage: imagen [prompt] [model]", threadID, messageID);
  }

  const prompt = args.slice(0, -1).join(' ');
  const model = args[args.length - 1];

  try {
    // Fetch the list of available models
    const modelResponse = await axios.get('https://openapi-idk8.onrender.com/imagen/models');
    const availableModels = modelResponse.data.available_models;

    // If no model is provided, send the list of available models
    if (availableModels.indexOf(model) === -1) {
      return api.sendMessage(`Invalid or missing model. Available models are: ${availableModels.join(', ')}.`, threadID, messageID);
    }

    // Inform the user that the search is in progress
    api.sendMessage(`Searching for image with prompt "${prompt}" using model "${model}". Please wait...`, threadID, messageID);

    // Generate the image based on the prompt and model
    const imageResponse = await axios.get('https://openapi-idk8.onrender.com/imagen', {
      params: { prompt: prompt, model: model },
      responseType: 'arraybuffer'
    });
    
    const time = new Date();
    const timestamp = time.toISOString().replace(/[:.]/g, "-");
    const path = __dirname + '/cache/' + `${timestamp}_imagen.png`;

    // Save the image to a file
    fs.writeFileSync(path, imageResponse.data);

    // Send the image to the user
    api.sendMessage({
      body: `Generated image "${prompt}" using model "${model}"`,
      attachment: fs.createReadStream(path)
    }, threadID, () => fs.unlinkSync(path));

  } catch (error) {
    console.error('Error:', error);
    if (error.response && error.response.data && error.response.data.error) {
      api.sendMessage(`Error: ${error.response.data.error}`, threadID, messageID);
    } else {
      api.sendMessage('An error occurred while fetching the image.', threadID, messageID);
    }
  }
};
